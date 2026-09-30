const mongoose = require('mongoose');

const theatreSchema = new mongoose.Schema({
  _id: String,
  theatreName: { type: String, required: true },
  city: { type: String, required: true },
  address: String,
  screens: [{ type: String, ref: 'Screen' }]
}, { timestamps: true, collection: 'Theatres' });

module.exports = mongoose.model('Theatre', theatreSchema);