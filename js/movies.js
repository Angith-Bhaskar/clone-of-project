/* ==========================================================================
   movies.js
   Shared across search-results, movies, movie-details, show-timings.
   Search Results, Movie Listing and Show Timings all read live data from
   the backend API via js/api.js (loaded before this file: apiGet, apiPost,
   toLocalDateString, getQueryParam, escapeHTML, debounce, movieToCard,
   eventToCard).
   Relies on js/common.js already having run (navbar/footer injected,
   mediaCardHTML()/renderCardRow() available).
   ========================================================================== */

// Bumped on every search request; a response is discarded once a newer
// request has started, so a slow early keystroke can't overwrite later results.
let searchRequestId = 0;

/** Queries GET /movies?q= and GET /events?q=, renders both result rows, and
 *  returns the raw { movies, events } so the suggestion dropdown can reuse them. */
async function runSearch(query) {
  const movieGrid = document.getElementById("movieResults");
  const eventGrid = document.getElementById("eventResults");
  const emptyState = document.getElementById("emptyState");
  if (!movieGrid || !eventGrid) return null;

  const q = query.trim();
  const requestId = ++searchRequestId;

  movieGrid.innerHTML = `<p class="list-message">Searching&hellip;</p>`;
  eventGrid.innerHTML = "";
  if (emptyState) emptyState.hidden = true;

  try {
    const suffix = q ? `?q=${encodeURIComponent(q)}` : "";
    const [movies, events] = await Promise.all([
      apiGet(`/movies${suffix}`),
      apiGet(`/events${suffix}`),
    ]);
    if (requestId !== searchRequestId) return null; // a newer search has since started

    renderCardRow("movieResults", movies.map(movieToCard));
    renderCardRow("eventResults", events.map(eventToCard));

    const noResults = movies.length === 0 && events.length === 0;
    if (emptyState) emptyState.hidden = !noResults;

    return { movies, events };
  } catch (err) {
    if (requestId !== searchRequestId) return null;
    console.error(err);
    movieGrid.innerHTML = `<p class="list-message">Couldn't load results. Please try again.</p>`;
    eventGrid.innerHTML = "";
    if (emptyState) emptyState.hidden = true;
    return null;
  }
}

/** Rebuilds the suggestion dropdown from a runSearch() result. */
function renderSearchSuggestions(query, results) {
  const list = document.getElementById("resultsSuggestions");
  if (!list) return;

  const q = query.trim();
  if (!q) {
    list.classList.remove("active");
    list.innerHTML = "";
    return;
  }
  if (!results) return; // the search failed; leave whatever suggestions were showing

  const suggestions = [
    ...results.movies.map((m) => ({ title: m.title, href: `movie-details.html?id=${encodeURIComponent(m._id)}` })),
    ...results.events.map((e) => ({ title: e.title, href: "#" })),
  ];

  list.innerHTML = suggestions.length
    ? suggestions.map((item) => `<li><a href="${escapeHTML(item.href)}">${escapeHTML(item.title)}</a></li>`).join("")
    : `<li><a href="#">No results for "${escapeHTML(query)}"</a></li>`;
  list.classList.add("active");
}

/** Wires the on-page search box: debounced live search + its own suggestion dropdown. */
function setupResultsSearch() {
  const input = document.getElementById("resultsSearchInput");
  const list = document.getElementById("resultsSuggestions");
  if (!input) return;

  const search = async (value) => {
    const results = await runSearch(value);
    renderSearchSuggestions(value, results);
  };
  const debouncedSearch = debounce(search, 300);

  const initialQuery = getQueryParam("q");
  if (initialQuery) input.value = initialQuery;
  search(initialQuery);

  input.addEventListener("input", () => {
    if (!input.value.trim() && list) {
      list.classList.remove("active");
      list.innerHTML = "";
    }
    debouncedSearch(input.value);
  });

  document.addEventListener("click", (e) => {
    if (list && !e.target.closest(".results-search-box")) {
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

// Bumped on every request; a response is discarded if a newer one has since started.
let movieFilterRequestId = 0;

/** Reads the filter panel and calls GET /movies, then re-renders the grid. */
async function applyMovieFilters() {
  const grid = document.getElementById("movieListingGrid");
  if (!grid) return;

  const languages = getCheckedValues("filterLanguage");
  const genres = getCheckedValues("filterGenre");
  const formats = getCheckedValues("filterFormat");
  const minRating = Number(getCheckedValues("filterRating")[0] ?? 0);
  const priceRange = document.getElementById("priceRange");

  const params = new URLSearchParams();
  if (languages.length) params.set("language", languages.join(","));
  if (genres.length) params.set("genre", genres.join(","));
  if (formats.length) params.set("format", formats.join(","));
  if (minRating > 0) params.set("minRating", String(minRating));
  // Only send a price cap once the slider has actually been moved below its max.
  if (priceRange && Number(priceRange.value) < Number(priceRange.max)) {
    params.set("maxPrice", priceRange.value);
  }

  const emptyState = document.getElementById("listingEmptyState");
  const requestId = ++movieFilterRequestId;
  grid.innerHTML = `<p class="list-message">Loading movies&hellip;</p>`;
  if (emptyState) emptyState.hidden = true;

  try {
    const movies = await apiGet(`/movies?${params.toString()}`);
    if (requestId !== movieFilterRequestId) return; // a newer request has since started

    renderCardRow("movieListingGrid", movies.map(movieToCard));
    if (emptyState) emptyState.hidden = movies.length !== 0;

    const countEl = document.getElementById("resultCount");
    if (countEl) countEl.textContent = `${movies.length} movie${movies.length === 1 ? "" : "s"}`;
  } catch (err) {
    if (requestId !== movieFilterRequestId) return;
    console.error(err);
    grid.innerHTML = `<p class="list-message">Couldn't load movies. Please try again.</p>`;
    if (emptyState) emptyState.hidden = true;
  }
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
  const debouncedApply = debounce(applyMovieFilters, 250);
  if (priceRange) {
    priceRange.addEventListener("input", () => {
      if (priceLabel) priceLabel.textContent = `Up to ₹${priceRange.value}`;
      debouncedApply();
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

/** Builds one cast/crew person card's markup. `role` is omitted for cast. */
function personCardHTML(person) {
  const roleLine = person.role ? `<br /><small>${escapeHTML(person.role)}</small>` : "";
  return `
    <div class="person-card">
      <img src="${escapeHTML(person.photo || "")}" alt="" />
      <span>${escapeHTML(person.name)}${roleLine}</span>
    </div>`;
}

/** Fills the Movie Details page from a fetched movie document. */
function renderMovieDetails(movie) {
  const banner = document.getElementById("detailsBanner");
  const poster = document.getElementById("detailsPoster");
  const bookBtn = document.getElementById("bookTicketsBtn");

  if (banner) banner.style.backgroundImage = `url('${movie.banner || movie.poster}')`;
  if (poster) {
    poster.src = movie.poster || "";
    poster.alt = `${movie.title} poster`;
  }

  setText(document.getElementById("detailsTitle"), movie.title);
  document.title = `BookMyShow Clone — ${movie.title}`;

  const tags = document.getElementById("detailsTags");
  if (tags) {
    const genreTags = (movie.genres || [])
      .map((g) => `<span class="tag">${escapeHTML(g)}</span>`)
      .join("");
    tags.innerHTML = `<span class="tag-rating">&#9733; ${formatRating(movie.rating)}/10</span>${genreTags}`;
  }

  const meta = document.getElementById("detailsMetaLine");
  if (meta) {
    const parts = [
      formatDuration(movie.duration),
      movie.languages?.join(", "),
      movie.releaseDate ? `Released ${formatDate(movie.releaseDate)}` : "",
    ].filter(Boolean);
    setText(meta, parts.join(" • "));
  }

  setText(document.getElementById("aboutText"), movie.description || "");

  const castRow = document.getElementById("castRow");
  if (castRow) {
    castRow.innerHTML = (movie.cast || []).map(personCardHTML).join("")
      || `<p class="list-message">No cast listed.</p>`;
  }

  const crewRow = document.getElementById("crewRow");
  if (crewRow) {
    crewRow.innerHTML = (movie.crew || []).map(personCardHTML).join("")
      || `<p class="list-message">No crew listed.</p>`;
  }

  if (bookBtn) {
    bookBtn.disabled = false;
    bookBtn.onclick = () => {
      window.location.href = `show-timings.html?movieId=${encodeURIComponent(movie._id)}`;
    };
  }
}

/** Shows a friendly "not found" state when the movie id is missing or invalid. */
function renderMovieNotFound() {
  setText(document.getElementById("detailsTitle"), "Movie not found");
  setText(document.getElementById("detailsMetaLine"), "");
  setText(document.getElementById("aboutText"), "We couldn't find this movie. It may have been removed.");

  const tags = document.getElementById("detailsTags");
  if (tags) tags.innerHTML = "";
  const castRow = document.getElementById("castRow");
  if (castRow) castRow.innerHTML = "";
  const crewRow = document.getElementById("crewRow");
  if (crewRow) crewRow.innerHTML = "";

  const poster = document.getElementById("detailsPoster");
  if (poster) poster.removeAttribute("src");
  const banner = document.getElementById("detailsBanner");
  if (banner) banner.style.backgroundImage = "none";
  const bookBtn = document.getElementById("bookTicketsBtn");
  if (bookBtn) bookBtn.disabled = true;
}

/** Loads the Movie Details page from ?id=, or shows "Movie not found". */
async function loadMovieDetails() {
  const movieId = getQueryParam("id");

  try {
    if (!movieId) throw new Error("No movie id in URL");
    const movie = await apiGet(`/movies/${encodeURIComponent(movieId)}`);
    renderMovieDetails(movie);
  } catch (err) {
    console.error(err);
    renderMovieNotFound();
  }
}

/** Starts the Movie Details page (does nothing on other pages). */
function initMovieDetails() {
  if (!document.getElementById("detailsBanner")) return;
  loadMovieDetails();
}

/* ==========================================================================
   Show Timings page
   ========================================================================== */

// Filled from the API. This used to be a hardcoded array.
let THEATRES = [];

// Which movie? Read from the URL: show-timings.html?movieId=m1
const SHOW_MOVIE_ID = getQueryParam("movieId") || "m1";

// Currently selected date as "YYYY-MM-DD" (set in initShowTimings)
let selectedDate = "";

/** Builds the next 7 days as { day, num, value } pills, today first. */
function buildUpcomingDates() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      day: i === 0 ? "Today" : days[d.getDay()],
      num: d.getDate(),
      value: toLocalDateString(d), // "YYYY-MM-DD", sent to the API
    });
  }
  return dates;
}

function renderDateSelector() {
  const wrap = document.getElementById("dateSelector");
  if (!wrap) return;

  wrap.innerHTML = buildUpcomingDates()
    .map(
      (d, i) => `
        <div class="date-pill${i === 0 ? " selected" : ""}" data-date="${d.value}">
          <span class="date-day">${d.day}</span>
          <span class="date-num">${d.num}</span>
        </div>`
    )
    .join("");

  wrap.querySelectorAll(".date-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      wrap.querySelectorAll(".date-pill").forEach((p) => p.classList.remove("selected"));
      pill.classList.add("selected");
      selectedDate = pill.dataset.date;
      loadShows(); // fetch that day's shows from the backend
    });
  });
}

/** Fetches the shows for the selected movie + date, then draws them. */
async function loadShows() {
  const wrap = document.getElementById("theatreList");
  if (!wrap) return;

  const requestedDate = selectedDate;
  wrap.innerHTML = `<p class="theatre-message">Loading showtimes…</p>`;

  try {
    const data = await apiGet(
      `/shows?movieId=${encodeURIComponent(SHOW_MOVIE_ID)}&date=${requestedDate}`
    );
    // If the user clicked another date while this was loading, ignore the old response
    if (requestedDate !== selectedDate) return;

    THEATRES = data;
    renderTheatreList();
  } catch (err) {
    if (requestedDate !== selectedDate) return;
    console.error(err);
    wrap.innerHTML = `<p class="theatre-message">Couldn't load showtimes. Please try again.</p>`;
  }
}

function renderTheatreList() {
  const wrap = document.getElementById("theatreList");
  if (!wrap) return;

  if (THEATRES.length === 0) {
    wrap.innerHTML = `<p class="theatre-message">No shows available on this date.</p>`;
    return;
  }

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
          ${theatre.shows
            .map(
              (s) => `<button type="button" class="showtime-btn"
                        data-show-id="${s.id}"
                        title="${s.language} · ${s.format}">${s.time}</button>`
            )
            .join("")}
        </div>
      </article>`
  ).join("");

  // Highlight the clicked showtime, then go to seat selection for THAT show.
  wrap.querySelectorAll(".showtime-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap
        .querySelectorAll(".showtime-btn.selected")
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      window.location.href = `seat-selection.html?showId=${btn.dataset.showId}`;
    });
  });
}

/** Loads the movie's title/languages/genres into the page header. */
async function loadShowTimingsHeader() {
  const titleEl = document.getElementById("movieTitle");
  const metaEl = document.getElementById("movieMetaLine");
  if (!titleEl) return;

  try {
    const movie = await apiGet(`/movies/${encodeURIComponent(SHOW_MOVIE_ID)}`);
    titleEl.textContent = movie.title;
    if (metaEl) {
      const parts = [];
      if (movie.languages?.length) parts.push(movie.languages.join(", "));
      if (movie.genres?.length) parts.push(movie.genres.join(", "));
      metaEl.textContent = parts.join(" • ");
    }
  } catch (err) {
    console.error(err);
    titleEl.textContent = "Movie not found";
    if (metaEl) metaEl.textContent = "";
  }
}

/** Starts the Show Timings page (does nothing on other pages). */
function initShowTimings() {
  if (!document.getElementById("theatreList")) return;
  selectedDate = toLocalDateString(new Date());
  loadShowTimingsHeader();
  renderDateSelector();
  loadShows();
}

document.addEventListener("DOMContentLoaded", () => {
  setupResultsSearch();
  setupMovieListingFilters();
  setupExpandableDescription();
  initMovieDetails();
  initShowTimings();
});