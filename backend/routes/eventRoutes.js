const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { escapeRegex, parseNumberParam } = require('../utils/queryHelpers');

// GET /api/events?q=&category=&city=&limit=
router.get('/', async (req, res) => {
  try {
    const { q, category, city } = req.query;
    const limitNum = parseNumberParam(req.query.limit, 'limit');

    const filter = {};
    if (q) filter.title = { $regex: escapeRegex(q), $options: 'i' };
    if (category) filter.category = category;
    if (city) filter.city = { $regex: `^${escapeRegex(city)}$`, $options: 'i' };

    let query = Event.find(filter).sort({ rating: -1 });
    if (limitNum !== undefined) query = query.limit(limitNum);

    const events = await query;
    res.json(events);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

module.exports = router;
