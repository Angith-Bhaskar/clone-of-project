const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  _id: String,
  theatreId: { type: String, ref: 'Theatre', required: true },
  screenName: { type: String, required: true },
  totalSeats: Number
}, { timestamps: true, collection: 'Screens' });

module.exports = mongoose.model('Screen', screenSchema);