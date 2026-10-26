const express = require('express');
const router = express.Router();
const Theatre = require('../models/Theatre');

// GET /api/cities — the cities that have at least one theatre (feeds the navbar city picker).
router.get('/', async (req, res) => {
  try {
    const cities = await Theatre.distinct('city');
    res.json(cities.sort());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
