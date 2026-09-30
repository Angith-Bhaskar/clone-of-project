const express = require('express');
const router = express.Router();
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const { buildShowSummary } = require('../utils/showSummary');

const SEAT_CATEGORY_ORDER = ['Platinum', 'Gold', 'Silver'];

// "10:30 AM" -> minutes since midnight, so times sort correctly
const toMinutes = (t) => {
  const [time, period] = t.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

// GET /api/shows?movieId=m1&date=2026-09-28
router.get('/', async (req, res) => {
  try {
    const { movieId, date } = req.query;

    if (!movieId) {
      return res.status(400).json({ error: 'movieId is required' });
    }

    // Start and end of the requested day (defaults to today)
    const start = date ? new Date(`${date}T00:00:00`) : new Date();
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'Invalid date, use YYYY-MM-DD' });
    }
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const shows = await Show.find({
      movieId,
      showDate: { $gte: start, $lt: end }
    }).populate('theatreId');

    // Group the flat list of shows by theatre
    const grouped = new Map();

    shows.forEach((show) => {
      const theatre = show.theatreId;
      if (!theatre) return;

      if (!grouped.has(theatre._id)) {
        grouped.set(theatre._id, {
          theatreId: theatre._id,
          name: theatre.theatreName,
          address: theatre.address,
          languages: new Set(),
          formats: new Set(),
          shows: []
        });
      }

      const entry = grouped.get(theatre._id);
      entry.languages.add(show.language);
      entry.formats.add(show.format);
      entry.shows.push({
        id: show._id,
        time: show.showTime,
        language: show.language,
        format: show.format,
        pricing: show.pricing
      });
    });

  const result = [...grouped.values()]
      .map((t) => ({
        ...t,
        languages: [...t.languages],
        formats: [...t.formats],
        shows: t.shows.sort((a, b) => toMinutes(a.time) - toMinutes(b.time))
      }))
      .sort((a, b) =>
        a.theatreId.localeCompare(b.theatreId, undefined, { numeric: true })
      );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shows/:id — show summary with movie/theatre populated, plus pricing.
router.get('/:id', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movieId')
      .populate('theatreId');

    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    res.json(buildShowSummary(show));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/shows/:id/seats — seats grouped Platinum -> Gold -> Silver, each
// with its price and rows (sorted), each row with its seats sorted by number.
router.get('/:id/seats', async (req, res) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return res.status(404).json({ error: 'Show not found' });
    }

    const seats = await Seat.find({ showId: show._id });

    const grouped = SEAT_CATEGORY_ORDER.map((category) => {
      const rowsMap = new Map();

      seats
        .filter((seat) => seat.category === category)
        .forEach((seat) => {
          if (!rowsMap.has(seat.row)) rowsMap.set(seat.row, []);
          rowsMap.get(seat.row).push({ id: seat._id, number: seat.number, status: seat.status });
        });

      const rows = [...rowsMap.entries()]
        .sort(([rowA], [rowB]) => rowA.localeCompare(rowB))
        .map(([row, rowSeats]) => ({
          row,
          seats: rowSeats.sort((a, b) => a.number - b.number),
        }));

      return { category, price: show.pricing?.[category], rows };
    });

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;