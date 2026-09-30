const mongoose = require('mongoose');

const showSchema = new mongoose.Schema({
  _id: String,
  movieId: { type: String, ref: 'Movie', required: true },
  theatreId: { type: String, ref: 'Theatre', required: true },
  screenId: { type: String, ref: 'Screen', required: true },
  showDate: { type: Date, required: true },
  showTime: { type: String, required: true },
  language: String,
  format: { type: String, enum: ['2D', '3D', 'IMAX'] },
  pricing: {
    Platinum: Number,
    Gold: Number,
    Silver: Number
  }
}, { timestamps: true, collection: 'Shows' });

module.exports = mongoose.model('Show', showSchema);