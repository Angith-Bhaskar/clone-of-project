const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { buildShowSummary } = require('../utils/showSummary');
const { MIN_SEATS_PER_BOOKING, MAX_SEATS_PER_BOOKING, computePricing } = require('../utils/pricing');
const { generateId } = require('../utils/ids');
const { GUEST_USER_ID } = require('../utils/currentUser');

const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'];
const BOOKING_STATUSES = ['upcoming', 'completed', 'cancelled'];

// GET /api/bookings?userId=&status= — newest first, one row per booking with
// enough show detail for the history list. `userId` defaults to the guest
// placeholder until the auth cycle replaces it with the logged-in user's id.
router.get('/', async (req, res) => {
  try {
    const { userId = GUEST_USER_ID, status } = req.query;

    if (status && !BOOKING_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${BOOKING_STATUSES.join(', ')}` });
    }

    const filter = { userId };
    if (status) filter.bookingStatus = status;

    const bookings = await Booking.find(filter).sort({ bookedAt: -1 });

    const results = await Promise.all(
      bookings.map(async (booking) => {
        const show = await Show.findById(booking.showId).populate('movieId').populate('theatreId');
        return {
          id: booking._id,
          movie: show?.movieId && { id: show.movieId._id, title: show.movieId.title, poster: show.movieId.poster },
          theatre: show?.theatreId && { id: show.theatreId._id, name: show.theatreId.theatreName },
          showDate: show?.showDate,
          showTime: show?.showTime,
          seatCount: booking.seatIds.length,
          amount: booking.totalAmount,
          status: booking.bookingStatus,
        };
      })
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validates {showId, seatIds}, loads the show + its requested seats, and
// checks the seat-count/ownership rules shared by preview and create.
// Throws an Error with .status set on any failure.
async function loadShowAndRequestedSeats(body) {
  const { showId, seatIds } = body || {};

  if (!showId || typeof showId !== 'string') {
    const err = new Error('showId is required');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(seatIds) || seatIds.length === 0) {
    const err = new Error('seatIds must be a non-empty array');
    err.status = 400;
    throw err;
  }

  const uniqueSeatIds = [...new Set(seatIds)];
  if (uniqueSeatIds.length < MIN_SEATS_PER_BOOKING || uniqueSeatIds.length > MAX_SEATS_PER_BOOKING) {
    const err = new Error(`You can book between ${MIN_SEATS_PER_BOOKING} and ${MAX_SEATS_PER_BOOKING} seats`);
    err.status = 400;
    throw err;
  }

  const show = await Show.findById(showId).populate('movieId').populate('theatreId');
  if (!show) {
    const err = new Error('Show not found');
    err.status = 404;
    throw err;
  }

  const seats = await Seat.find({ _id: { $in: uniqueSeatIds }, showId });
  if (seats.length !== uniqueSeatIds.length) {
    const err = new Error('One or more seats do not belong to this show');
    err.status = 400;
    throw err;
  }

  return { show, seats };
}

// POST /api/bookings/preview — validates and prices a selection. Writes nothing.
router.post('/preview', async (req, res) => {
  try {
    const { show, seats } = await loadShowAndRequestedSeats(req.body);

    const unavailable = seats.filter((s) => s.status !== 'available');
    if (unavailable.length > 0) {
      return res.status(409).json({ error: 'One or more seats were just booked by someone else' });
    }

    const ticketTotal = seats.reduce((sum, s) => sum + (show.pricing?.[s.category] || 0), 0);
    const pricing = computePricing(ticketTotal, seats.length);

    const sortedLabels = seats
      .slice()
      .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number)
      .map((s) => `${s.row}${s.number}`);

    res.json({
      show: buildShowSummary(show),
      seats: sortedLabels,
      ticketCount: seats.length,
      ...pricing,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

// POST /api/bookings — creates the booking + payment atomically. All or nothing:
// only seats still `available` get flipped to `booked`; if that count doesn't
// match what was requested, the whole transaction aborts with 409 so two
// tabs racing for the same seat can't both succeed.
router.post('/', async (req, res) => {
  const { paymentMethod } = req.body || {};

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid paymentMethod' });
  }

  let show, seats;
  try {
    ({ show, seats } = await loadShowAndRequestedSeats(req.body));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }

  const seatIds = seats.map((s) => s._id);
  const session = await mongoose.startSession();

  try {
    let bookingId;

    await session.withTransaction(async () => {
      const updateResult = await Seat.updateMany(
        { _id: { $in: seatIds }, showId: show._id, status: 'available' },
        { $set: { status: 'booked' } },
        { session }
      );

      if (updateResult.modifiedCount !== seatIds.length) {
        const err = new Error('One or more seats were just booked by someone else');
        err.status = 409;
        throw err;
      }

      const ticketTotal = seats.reduce((sum, s) => sum + (show.pricing?.[s.category] || 0), 0);
      const { grandTotal } = computePricing(ticketTotal, seats.length);

      bookingId = generateId('BMS');

      await Booking.create(
        [{
          _id: bookingId,
          userId: GUEST_USER_ID,
          showId: show._id,
          seatIds,
          totalAmount: grandTotal,
          bookingStatus: 'upcoming',
          bookedAt: new Date(),
        }],
        { session }
      );

      await Payment.create(
        [{
          _id: generateId('PAY'),
          bookingId,
          paymentMethod,
          transactionId: generateId('TXN'),
          paymentStatus: 'success',
          paidAt: new Date(),
        }],
        { session }
      );
    });

    res.status(201).json({ bookingId });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  } finally {
    await session.endSession();
  }
});

// GET /api/bookings/:id — full booking detail for the confirmation page.
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const show = await Show.findById(booking.showId).populate('movieId').populate('theatreId');
    const seats = await Seat.find({ _id: { $in: booking.seatIds } });
    const payment = await Payment.findOne({ bookingId: booking._id });

    const sortedLabels = seats
      .slice()
      .sort((a, b) => a.row.localeCompare(b.row) || a.number - b.number)
      .map((s) => `${s.row}${s.number}`);

    res.json({
      id: booking._id,
      show: buildShowSummary(show),
      seats: sortedLabels,
      amount: booking.totalAmount,
      bookingStatus: booking.bookingStatus,
      bookedAt: booking.bookedAt,
      payment: payment && {
        method: payment.paymentMethod,
        transactionId: payment.transactionId,
        status: payment.paymentStatus,
        paidAt: payment.paidAt,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
