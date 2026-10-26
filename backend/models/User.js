const mongoose = require('mongoose');

// Collection is "Users" (new). The older team-created "User" collection is left untouched.
const userSchema = new mongoose.Schema({
  _id: String,
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  // bcrypt hash, never the plain password. select:false keeps it out of queries by default.
  password: { type: String, required: true, select: false },
  profileImage: { type: String, default: '' },
}, { timestamps: true, collection: 'Users' });

module.exports = mongoose.model('User', userSchema);
