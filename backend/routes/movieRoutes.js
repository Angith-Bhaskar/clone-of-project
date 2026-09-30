const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { parseListParam, escapeRegex, parseNumberParam } = require('../utils/queryHelpers');

// GET /api/movies?q=&language=&genre=&format=&minRating=&maxPrice=&limit=
router.get('/', async (req, res) => {
  try {
    const { q, language, genre, format, limit } = req.query;
    const minRating = parseNumberParam(req.query.minRating, 'minRating');
    const maxPrice = parseNumberParam(req.query.maxPrice, 'maxPrice');
    const limitNum = parseNumberParam(limit, 'limit');

    const filter = {};

    if (q) {
      filter.title = { $regex: escapeRegex(q), $options: 'i' };
    }

    const languages = parseListParam(language);
    if (languages.length) filter.languages = { $in: languages };

    const genres = parseListParam(genre);
    if (genres.length) filter.genres = { $in: genres };

    if (minRating !== undefined) filter.rating = { $gte: minRating };

    // format/maxPrice are answered from Shows: a movie only qualifies if it
    // has at least one show matching that format / cheap enough (Silver is
    // the cheapest category).
    const formats = parseListParam(format);
    if (formats.length || maxPrice !== undefined) {
      const showFilter = {};
      if (formats.length) showFilter.format = { $in: formats };
      if (maxPrice !== undefined) showFilter['pricing.Silver'] = { $lte: maxPrice };

      const movieIds = await Show.distinct('movieId', showFilter);
      filter._id = { $in: movieIds };
    }

    let query = Movie.find(filter).sort({ rating: -1 });
    if (limitNum !== undefined) query = query.limit(limitNum);

    const movies = await query;
    res.json(movies);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;