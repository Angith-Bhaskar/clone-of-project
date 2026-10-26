const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  _id: String,
  userId: { type: String, required: true },
  showId: { type: String, ref: 'Show', required: true },
  seatIds: [{ type: String, ref: 'Seat' }],
  totalAmount: { type: Number, required: true },
  bookingStatus: { type: String, enum: ['upcoming', 'completed', 'cancelled'], default: 'upcoming' },
  bookedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'Bookings' });

module.exports = mongoose.model('Booking', bookingSchema);
