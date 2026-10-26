const LANGUAGES = ['Hindi', 'English', 'Tamil', 'Telugu'];
const GENRES = ['Action', 'Comedy', 'Drama', 'Romance', 'Sci-Fi', 'Thriller', 'Mystery', 'Adventure'];
const FORMATS = ['2D', '3D', 'IMAX'];
const RATINGS = [
  { value: '0', label: 'All' },
  { value: '7', label: '7+ ★' },
  { value: '8', label: '8+ ★' },
  { value: '8.5', label: '8.5+ ★' },
];

export const PRICE_MAX = 500;

export const DEFAULT_FILTERS = {
  languages: [],
  genres: [],
  formats: [],
  minRating: '0',
  maxPrice: PRICE_MAX,
};

// A group of checkboxes. "Controlled": the boxes show whatever `selected` says,
// and a click only asks the parent to change it. The filter state lives in one place.
function CheckboxGroup({ legend, options, selected, onChange }) {
  function toggle(option) {
    onChange(selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option]);
  }

  return (
    <fieldset className="filter-group">
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option}>
          <input type="checkbox" checked={selected.includes(option)} onChange={() => toggle(option)} /> {option}
        </label>
      ))}
    </fieldset>
  );
}

export default function FilterPanel({ filters, onChange, onClear }) {
  const set = (key) => (value) => onChange({ ...filters, [key]: value });

  return (
    <aside className="filter-panel" id="filterPanel">
      <div className="filter-panel-header">
        <h3>Filters</h3>
        <button type="button" className="clear-filters-btn" onClick={onClear}>Clear All</button>
      </div>

      <CheckboxGroup legend="Language" options={LANGUAGES} selected={filters.languages} onChange={set('languages')} />
      <CheckboxGroup legend="Genre" options={GENRES} selected={filters.genres} onChange={set('genres')} />
      <CheckboxGroup legend="Format" options={FORMATS} selected={filters.formats} onChange={set('formats')} />

      <fieldset className="filter-group">
        <legend>Price</legend>
        <input
          type="range"
          min="100"
          max={PRICE_MAX}
          step="10"
          value={filters.maxPrice}
          onChange={(e) => set('maxPrice')(Number(e.target.value))}
        />
        <span className="filter-hint">Up to ₹{filters.maxPrice}</span>
      </fieldset>

      <fieldset className="filter-group">
        <legend>Rating</legend>
        {RATINGS.map((r) => (
          <label key={r.value}>
            <input
              type="radio"
              name="filterRating"
              value={r.value}
              checked={filters.minRating === r.value}
              onChange={() => set('minRating')(r.value)}
            />{' '}
            {r.label}
          </label>
        ))}
      </fieldset>
    </aside>
  );
}
