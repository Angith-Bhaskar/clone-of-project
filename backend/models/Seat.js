const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  _id: String,
  showId: { type: String, ref: 'Show', required: true },
  row: { type: String, required: true },
  number: { type: Number, required: true },
  category: { type: String, enum: ['Platinum', 'Gold', 'Silver'], required: true },
  status: { type: String, enum: ['available', 'booked'], default: 'available' }
}, { timestamps: true, collection: 'Seats' });

module.exports = mongoose.model('Seat', seatSchema);