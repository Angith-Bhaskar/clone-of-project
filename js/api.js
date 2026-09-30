/* ==========================================================================
   api.js
   Single shared frontend toolkit: API access, small DOM/formatting helpers,
   and mappers from API shapes to the object shape mediaCardHTML() expects.
   Must be loaded (via <script>) on every data-driven page, after common.js
   and BEFORE that page's own script file.
   ========================================================================== */

const API_BASE = 'http://localhost:5000/api';

/** GET helper. Throws an Error (with a numeric .status) on a non-OK response. */
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/** POST helper. Sends `body` as JSON. Throws an Error (with .status) on a non-OK response. */
async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const responseBody = await res.json().catch(() => ({}));
    const err = new Error(responseBody.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/* ---- Date helpers -------------------------------------------------------- */

// Local YYYY-MM-DD. toISOString() converts to UTC and can shift the date.
function toLocalDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Formats an ISO/Date value as "12 Jun 2026". */
function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ---- Small DOM helpers ---------------------------------------------------- */

/** Reads a query param from the current URL (e.g. show-timings.html?movieId=m1). */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

/** Escapes text for safe insertion into innerHTML. */
function escapeHTML(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

/** Sets an element's textContent if the element exists. */
function setText(el, text) {
  if (el) el.textContent = text;
}

/** Debounces `fn`, delaying invocation until `delay` ms after the last call. */
function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ---- Formatters ------------------------------------------------------------ */

/** "8.2" style rating, one decimal place. */
function formatRating(rating) {
  const n = Number(rating);
  return Number.isFinite(n) ? n.toFixed(1) : '--';
}

/** Minutes -> "2h 8m". */
function formatDuration(minutes) {
  const n = Number(minutes);
  if (!Number.isFinite(n) || n <= 0) return '';
  const h = Math.floor(n / 60);
  const m = n % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/** Number -> "₹350" (no decimals; prices in this project are whole rupees). */
function formatRupees(amount) {
  const n = Number(amount);
  return `₹${Number.isFinite(n) ? Math.round(n).toLocaleString('en-IN') : '0'}`;
}

/* ---- API-shape mappers -----------------------------------------------------
   Turn a Movie/Event document from the API into the { title, meta, rating,
   poster, href } shape mediaCardHTML() (js/common.js) expects. There's no
   certificate (UA/U) field in the data model, so movie card meta lines show
   genres + languages instead. */

function movieToCard(movie) {
  return {
    title: movie.title,
    meta: [movie.genres?.join(', '), movie.languages?.join(', ')].filter(Boolean).join(' • '),
    rating: formatRating(movie.rating),
    poster: movie.poster,
    href: `movie-details.html?id=${encodeURIComponent(movie._id)}`,
  };
}

function eventToCard(event) {
  return {
    title: event.title,
    meta: [event.type, event.city].filter(Boolean).join(' • '),
    rating: formatRating(event.rating),
    poster: event.poster,
    href: '#',
  };
}
