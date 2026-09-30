const mongoose = require('mongoose');

const castSchema = new mongoose.Schema({
  name: { type: String, required: true },
  photo: String
}, { _id: false });

const crewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: String,
  photo: String
}, { _id: false });

const movieSchema = new mongoose.Schema({
  _id: String,
  title: {
    type: String,
    required: true
  },
  description: String,
  languages: [String],
  genres: [String],
  duration: Number,
  releaseDate: Date,
  rating: Number,
  poster: String,
  banner: String,
  cast: [castSchema],
  crew: [crewSchema]
}, { timestamps: true, collection: 'Movies' });

module.exports = mongoose.model('Movie', movieSchema);