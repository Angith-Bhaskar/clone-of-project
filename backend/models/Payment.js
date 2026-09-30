const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  _id: String,
  bookingId: { type: String, ref: 'Booking', required: true },
  paymentMethod: { type: String, enum: ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet'], required: true },
  transactionId: String,
  paymentStatus: { type: String, enum: ['success', 'failed', 'pending'], default: 'success' },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 'Payments' });

module.exports = mongoose.model('Payment', paymentSchema);
