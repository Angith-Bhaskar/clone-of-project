const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { generateId } = require('../utils/ids');

const SALT_ROUNDS = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const MIN_PASSWORD = 6;

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, phone: user.phone, profileImage: user.profileImage };
}

function signToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

function validateProfile({ name, email, phone }) {
  if (typeof name !== 'string' || name.trim().length < 2) return 'Enter your full name';
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) return 'Enter a valid email address';
  if (typeof phone !== 'string' || !PHONE_RE.test(phone.trim())) return 'Enter a valid 10-digit mobile number';
  return null;
}

// MongoDB's unique index throws code 11000; turn it into a readable 409.
function duplicateMessage(err) {
  if (err.code !== 11000) return null;
  return err.keyPattern?.phone
    ? 'An account with this phone number already exists'
    : 'An account with this email already exists';
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const body = req.body || {};
    const problem = validateProfile(body)
      || (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD
        ? `Password must be at least ${MIN_PASSWORD} characters`
        : null);
    if (problem) return res.status(400).json({ error: problem });

    const user = await User.create({
      _id: generateId('U'),
      name: body.name.trim(),
      email: body.email.trim(),
      phone: body.phone.trim(),
      password: await bcrypt.hash(body.password, SALT_ROUNDS),
    });

    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    const dup = duplicateMessage(err);
    res.status(dup ? 409 : 500).json({ error: dup || err.message });
  }
});

// POST /api/auth/login  { identifier: email or 10-digit phone, password }
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({ error: 'Enter your email/phone and password' });
    }

    const id = identifier.trim();
    const user = await User
      .findOne(id.includes('@') ? { email: id.toLowerCase() } : { phone: id })
      .select('+password');

    // Same message for "no such user" and "wrong password" so attackers can't probe which accounts exist.
    const ok = user && await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Incorrect email/phone or password' });

    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user));
});

// PUT /api/auth/me  { name, email, phone }
router.put('/me', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const problem = validateProfile(body);
    if (problem) return res.status(400).json({ error: problem });

    req.user.name = body.name.trim();
    req.user.email = body.email.trim();
    req.user.phone = body.phone.trim();
    await req.user.save();

    res.json(publicUser(req.user));
  } catch (err) {
    const dup = duplicateMessage(err);
    res.status(dup ? 409 : 500).json({ error: dup || err.message });
  }
});

// POST /api/auth/forgot-password  { email }
// There is no email service in this project, so in demo mode the reset token is
// returned in the response instead of being emailed. The token is signed with
// (secret + current password hash), so it works once: after the password changes
// the signature no longer matches.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) {
      return res.status(400).json({ error: 'Enter a valid email address' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    const message = 'If an account exists for that email, a password reset link has been sent.';
    if (!user) return res.json({ message });

    const resetToken = jwt.sign(
      { sub: user._id, purpose: 'reset' },
      process.env.JWT_SECRET + user.password,
      { expiresIn: '15m' }
    );
    res.json({ message, resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/reset-password  { token, password }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters` });
    }

    // Decode (without trusting) just to learn which user's hash to verify against.
    const unverified = typeof token === 'string' ? jwt.decode(token) : null;
    const user = unverified?.sub && await User.findById(unverified.sub).select('+password');
    if (!user) return res.status(400).json({ error: 'Reset link is invalid or has expired' });

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET + user.password);
      if (payload.purpose !== 'reset') throw new Error('wrong purpose');
    } catch {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(password, SALT_ROUNDS);
    await user.save();
    res.json({ message: 'Password updated. You can now sign in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
