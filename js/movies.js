/* ==========================================================================
   movies.js
   Shared across search-results, movies, movie-details, show-timings.
   Currently implements: Search Results page (dummy search filtering) and
   Movie Listing page (dummy filter panel: language/genre/format/price/rating).
   Relies on js/common.js already having run (navbar/footer injected,
   mediaCardHTML()/renderCardRow() available).
   ========================================================================== */

/* ---- Dummy dataset (hardcoded, no backend) ------------------------------
   `meta`/`rating`/`poster`/`title` feed mediaCardHTML() (search results,
   listing grid). `language`/`genre`/`format`/`price`/`ratingValue` are the
   extra attributes the Movie Listing filter panel filters on. */

const ALL_MOVIES = [
  { title: "Fireheart", meta: "Action, Thriller | UA", rating: "8.2", ratingValue: 8.2, poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80", language: "Hindi", genre: "Action", format: "2D", price: 220 },
  { title: "Silent Tide", meta: "Drama | U", rating: "7.6", ratingValue: 7.6, poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80", language: "English", genre: "Drama", format: "2D", price: 180 },
  { title: "The Last Signal", meta: "Sci-Fi | UA", rating: "8.9", ratingValue: 8.9, poster: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=400&q=80", language: "English", genre: "Sci-Fi", format: "IMAX", price: 350 },
  { title: "Midnight Runners", meta: "Action, Comedy | UA", rating: "7.4", ratingValue: 7.4, poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80", language: "Hindi", genre: "Comedy", format: "2D", price: 200 },
  { title: "Crimson Sky", meta: "Adventure | U", rating: "8.0", ratingValue: 8.0, poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80", language: "Telugu", genre: "Adventure", format: "3D", price: 280 },
  { title: "Echoes of Us", meta: "Romance, Drama | UA", rating: "7.9", ratingValue: 7.9, poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80", language: "Tamil", genre: "Romance", format: "2D", price: 190 },
  { title: "Winter's Edge", meta: "Thriller | UA", rating: "8.3", ratingValue: 8.3, poster: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80", language: "English", genre: "Thriller", format: "IMAX", price: 320 },
  { title: "The Glass House", meta: "Mystery | UA", rating: "7.7", ratingValue: 7.7, poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80", language: "Hindi", genre: "Mystery", format: "2D", price: 210 },
];

const ALL_EVENTS = [
  { title: "Comedy Nights Live", meta: "Stand-up | Mumbai", rating: "8.5", poster: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80" },
  { title: "Neon Dreams Tour", meta: "Music Concert | Delhi", rating: "9.0", poster: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80" },
  { title: "Jazz Under Stars", meta: "Music | Bengaluru", rating: "8.1", poster: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80" },
  { title: "Indie Beats Fest", meta: "Music Festival | Pune", rating: "7.8", poster: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80" },
  { title: "Street Food Carnival", meta: "Food Fest | Chennai", rating: "8.6", poster: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
];

/** Reads the `q` query param, if the page was reached via a suggestion link. */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

/** Filters ALL_MOVIES/ALL_EVENTS by title and re-renders the results page. */
function runSearch(query) {
  const q = query.trim().toLowerCase();

  const movieMatches = q
    ? ALL_MOVIES.filter((m) => m.title.toLowerCase().includes(q))
    : ALL_MOVIES;
  const eventMatches = q
    ? ALL_EVENTS.filter((e) => e.title.toLowerCase().includes(q))
    : ALL_EVENTS;

  renderCardRow("movieResults", movieMatches);
  renderCardRow("eventResults", eventMatches);

  const emptyState = document.getElementById("emptyState");
  const noResults = movieMatches.length === 0 && eventMatches.length === 0;
  emptyState.hidden = !noResults;
}

/** Wires the on-page search box: live filtering + its own suggestion dropdown. */
function setupResultsSearch() {
  const input = document.getElementById("resultsSearchInput");
  const list = document.getElementById("resultsSuggestions");
  if (!input) return;

  const initialQuery = getQueryParam("q");
  if (initialQuery) input.value = initialQuery;
  runSearch(initialQuery);

  input.addEventListener("input", () => {
    runSearch(input.value);

    const q = input.value.trim().toLowerCase();
    if (!q) {
      list.classList.remove("active");
      list.innerHTML = "";
      return;
    }

    const suggestions = [...ALL_MOVIES, ...ALL_EVENTS].filter((item) =>
      item.title.toLowerCase().includes(q)
    );

    list.innerHTML = suggestions.length
      ? suggestions
          .map((item) => `<li><a href="#">${item.title}</a></li>`)
          .join("")
      : `<li><a href="#">No results for "${input.value}"</a></li>`;
    list.classList.add("active");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".results-search-box")) {
      list.classList.remove("active");
    }
  });
}

/* ==========================================================================
   Movie Listing page
   ========================================================================== */

/** Reads the currently checked values for a filter group by name. */
function getCheckedValues(groupName) {
  return [...document.querySelectorAll(`input[name="${groupName}"]:checked`)].map(
    (el) => el.value
  );
}

/** Applies the language/genre/format/price/rating filters and re-renders the grid. */
function applyMovieFilters() {
  const languages = getCheckedValues("filterLanguage");
  const genres = getCheckedValues("filterGenre");
  const formats = getCheckedValues("filterFormat");
  const maxPrice = Number(document.getElementById("priceRange")?.value ?? 500);
  const minRating = Number(getCheckedValues("filterRating")[0] ?? 0);

  const filtered = ALL_MOVIES.filter((movie) => {
    if (languages.length && !languages.includes(movie.language)) return false;
    if (genres.length && !genres.includes(movie.genre)) return false;
    if (formats.length && !formats.includes(movie.format)) return false;
    if (movie.price > maxPrice) return false;
    if (movie.ratingValue < minRating) return false;
    return true;
  });

  renderCardRow("movieListingGrid", filtered);

  const noResults = document.getElementById("listingEmptyState");
  if (noResults) noResults.hidden = filtered.length !== 0;

  const countEl = document.getElementById("resultCount");
  if (countEl) countEl.textContent = `${filtered.length} movie${filtered.length === 1 ? "" : "s"}`;
}

/** Wires every filter control on the Movie Listing page to re-run the filter live. */
function setupMovieListingFilters() {
  const grid = document.getElementById("movieListingGrid");
  if (!grid) return;

  document
    .querySelectorAll('#filterPanel input[type="checkbox"], #filterPanel input[type="radio"]')
    .forEach((input) => input.addEventListener("change", applyMovieFilters));

  const priceRange = document.getElementById("priceRange");
  const priceLabel = document.getElementById("priceRangeLabel");
  if (priceRange) {
    priceRange.addEventListener("input", () => {
      if (priceLabel) priceLabel.textContent = `Up to ₹${priceRange.value}`;
      applyMovieFilters();
    });
  }

  const clearBtn = document.getElementById("clearFiltersBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document
        .querySelectorAll('#filterPanel input[type="checkbox"]')
        .forEach((el) => (el.checked = false));
      document
        .querySelectorAll('#filterPanel input[type="radio"]')
        .forEach((el) => (el.checked = el.value === "0"));
      if (priceRange) {
        priceRange.value = priceRange.max;
        if (priceLabel) priceLabel.textContent = `Up to ₹${priceRange.value}`;
      }
      applyMovieFilters();
    });
  }

  applyMovieFilters();
}

/* ==========================================================================
   Movie Details page
   ========================================================================== */

/** Toggles the clamped "About the Movie" paragraph between 2 lines and full text. */
function setupExpandableDescription() {
  const toggle = document.getElementById("expandToggle");
  const text = document.getElementById("aboutText");
  if (!toggle || !text) return;

  toggle.addEventListener("click", () => {
    const isExpanded = text.classList.toggle("expanded");
    toggle.textContent = isExpanded ? "Read less" : "Read more";
  });
}

/* ==========================================================================
   Show Timings page
   ========================================================================== */

const THEATRES = [
  {
    name: "PVR Cinemas: Phoenix Mall",
    address: "Phoenix Marketcity, Kurla West, Mumbai",
    languages: ["English", "Hindi"],
    formats: ["IMAX", "2D"],
    times: ["10:30 AM", "1:45 PM", "5:00 PM", "8:30 PM"],
  },
  {
    name: "INOX: R-City",
    address: "R-City Mall, Ghatkopar West, Mumbai",
    languages: ["Hindi"],
    formats: ["2D"],
    times: ["11:00 AM", "2:15 PM", "6:00 PM"],
  },
  {
    name: "Cinepolis: Fun Republic",
    address: "Fun Republic Mall, Andheri West, Mumbai",
    languages: ["English"],
    formats: ["3D", "2D"],
    times: ["12:00 PM", "3:30 PM", "7:15 PM", "10:00 PM"],
  },
];

/** Builds the next 7 days as { day: "Mon", num: "12" } pills, today first. */
function buildUpcomingDates() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({ day: i === 0 ? "Today" : days[d.getDay()], num: d.getDate() });
  }
  return dates;
}

function renderDateSelector() {
  const wrap = document.getElementById("dateSelector");
  if (!wrap) return;

  wrap.innerHTML = buildUpcomingDates()
    .map(
      (d, i) => `
        <div class="date-pill${i === 0 ? " selected" : ""}" data-index="${i}">
          <span class="date-day">${d.day}</span>
          <span class="date-num">${d.num}</span>
        </div>`
    )
    .join("");

  wrap.querySelectorAll(".date-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      wrap.querySelectorAll(".date-pill").forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");
      // Showtimes are dummy/static regardless of date in this frontend-only demo.
    });
  });
}

function renderTheatreList() {
  const wrap = document.getElementById("theatreList");
  if (!wrap) return;

  wrap.innerHTML = THEATRES.map(
    (theatre) => `
      <article class="theatre-card">
        <div class="theatre-card-header">
          <span class="theatre-name">${theatre.name}</span>
        </div>
        <p class="theatre-address">${theatre.address}</p>
        <div class="badge-row">
          ${theatre.languages.map((l) => `<span class="badge">${l}</span>`).join("")}
          ${theatre.formats.map((f) => `<span class="badge">${f}</span>`).join("")}
        </div>
        <div class="showtime-row">
          ${theatre.times
            .map((t) => `<button type="button" class="showtime-btn">${t}</button>`)
            .join("")}
        </div>
      </article>`
  ).join("");

  // Highlight the clicked showtime, then move on to seat selection.
  wrap.querySelectorAll(".showtime-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap
        .querySelectorAll(".showtime-btn.selected")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      window.location.href = "seat-selection.html";
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupResultsSearch();
  setupMovieListingFilters();
  setupExpandableDescription();
  renderDateSelector();
  renderTheatreList();
});
