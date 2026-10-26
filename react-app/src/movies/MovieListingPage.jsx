import { useState } from 'react';
import FilterPanel, { DEFAULT_FILTERS, PRICE_MAX } from './FilterPanel';
import MovieCard from './MovieCard';
import { apiGet } from '../lib/toolkit';
import { useDebouncedValue, useLoader } from '../lib/hooks';

/** Turns the filter state into the query string GET /movies understands. */
function buildQuery(filters) {
  const params = new URLSearchParams();
  if (filters.languages.length) params.set('language', filters.languages.join(','));
  if (filters.genres.length) params.set('genre', filters.genres.join(','));
  if (filters.formats.length) params.set('format', filters.formats.join(','));
  if (Number(filters.minRating) > 0) params.set('minRating', filters.minRating);
  // Only send a price cap once the slider has actually been moved below its max.
  if (filters.maxPrice < PRICE_MAX) params.set('maxPrice', String(filters.maxPrice));
  return params.toString();
}

export default function MovieListingPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Dragging the slider changes `filters` on every pixel; wait until it settles
  // before asking the server, so we don't fire dozens of requests.
  const settledFilters = useDebouncedValue(filters, 250);
  const query = buildQuery(settledFilters);

  // Re-fetches automatically whenever the query string changes.
  const { status, data: movies } = useLoader(() => apiGet(`/movies?${query}`), [query]);

  const count = movies?.length ?? 0;
  let results;
  if (status === 'error') {
    results = <p className="list-message">Couldn&apos;t load movies. Please try again.</p>;
  } else if (status === 'loading' && !movies) {
    results = <p className="list-message">Loading movies&hellip;</p>;
  } else {
    results = movies.map((movie) => <MovieCard key={movie._id} movie={movie} />);
  }

  return (
    <main className="container listing-page">
      <div className="section-heading">
        <h2>Movies in Your City</h2>
        <span className="result-count" id="resultCount">
          {movies && status !== 'error' ? `${count} movie${count === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      <div className="listing-layout">
        <FilterPanel filters={filters} onChange={setFilters} onClear={() => setFilters(DEFAULT_FILTERS)} />

        <section className="listing-results">
          <div className="card-row" id="movieListingGrid">{results}</div>

          {status === 'ready' && count === 0 && (
            <div className="empty-state" id="listingEmptyState">
              <img src="https://via.placeholder.com/160x160.png?text=No+Movies" alt="No movies" />
              <h3>No movies match these filters</h3>
              <p>Try relaxing a few filters to see more results.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
