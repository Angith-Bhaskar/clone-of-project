const crypto = require('crypto');

// Readable ids like "BMS1AB2C3D4" — a timestamp chunk plus a few random hex
// chars, so ids sort roughly chronologically but never collide in practice.
function generateId(prefix) {
  const time = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${time}${random}`;
}

module.exports = { generateId };
