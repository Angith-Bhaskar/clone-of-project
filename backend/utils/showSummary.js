// Shapes a Show document (with movieId/theatreId populated) into the summary
// used by GET /shows/:id and reused by the booking preview/create/detail
// routes, so every page shows the same movie/theatre/time/pricing shape.
function buildShowSummary(show) {
  const movie = show.movieId;
  const theatre = show.theatreId;

  return {
    id: show._id,
    movie: movie && {
      id: movie._id,
      title: movie.title,
      poster: movie.poster,
      duration: movie.duration,
    },
    theatre: theatre && {
      id: theatre._id,
      name: theatre.theatreName,
      address: theatre.address,
    },
    showDate: show.showDate,
    showTime: show.showTime,
    language: show.language,
    format: show.format,
    pricing: show.pricing,
  };
}

module.exports = { buildShowSummary };
