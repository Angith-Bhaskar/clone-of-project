const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Reads "Authorization: Bearer <token>", verifies the signature and expiry, loads
// the user and puts it on req.user. Anything wrong -> 401 and the route never runs.
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Please log in to continue' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.purpose) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: 'Account no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired, please log in again' });
  }
}

module.exports = { requireAuth };
