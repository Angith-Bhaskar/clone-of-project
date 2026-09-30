const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  _id: String,
  title: { type: String, required: true },
  category: { type: String, enum: ['live', 'premiere', 'outdoor', 'laughter'], required: true },
  type: String,
  city: String,
  rating: Number,
  poster: String,
  date: Date
}, { timestamps: true, collection: 'Events' });

module.exports = mongoose.model('Event', eventSchema);
