const mongoose = require('mongoose');
const { GUEST_USER_ID } = require('../utils/currentUser');

const bookingSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, default: GUEST_USER_ID },
  showId: { type: String, ref: 'Show', required: true },
  seatIds: [{ type: String, ref: 'Seat' }],
  totalAmount: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  bookedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'Bookings' });

module.exports = mongoose.model('Booking', bookingSchema);
