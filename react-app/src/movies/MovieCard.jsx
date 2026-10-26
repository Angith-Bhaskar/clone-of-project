import { formatRating } from '../lib/toolkit';

// Same markup and class names as the card the old pages draw, so css/common.css styles it unchanged.
export default function MovieCard({ movie }) {
  const meta = [movie.genres?.join(', '), movie.languages?.join(', ')].filter(Boolean).join(' • ');

  return (
    <a className="media-card" href={`movie-details.html?id=${encodeURIComponent(movie._id)}`}>
      <div className="media-card-poster" style={{ backgroundImage: `url('${movie.poster}')` }}>
        <span className="media-card-rating">&#9733; {formatRating(movie.rating)}</span>
      </div>
      <div className="media-card-body">
        <div className="media-card-title">{movie.title}</div>
        <div className="media-card-meta">{meta}</div>
      </div>
    </a>
  );
}
