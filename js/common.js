/* ==========================================================================
   common.js
   Shared across all pages: navbar/footer injection, city selector,
   navbar search suggestions, responsive menu toggle.
   Loaded on every page (after common.css, before js/api.js and the
   page-specific JS file — the navbar suggestion box needs apiGet/debounce/
   escapeHTML from js/api.js by the time DOMContentLoaded fires).
   ========================================================================== */

/* Dummy city list used by the city selector dropdown (frontend-only).
   Known gap (CLAUDE.md section 11): picking a city doesn't filter data —
   all seeded theatres are in Mumbai regardless of selection. */
const CITIES = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad",
  "Ahmedabad", "Chandigarh", "Chennai", "Pune", "Kolkata", "Kochi"
];

/**
 * Injects the shared navbar markup into #navbar, then wires up its
 * interactive bits (city selector, search suggestions, mobile menu).
 */
function renderNavbar() {
  const mount = document.getElementById("navbar");
  if (!mount) return;

  const savedCity = localStorage.getItem("bms_city") || "Mumbai";

  mount.innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <button class="menu-toggle" id="menuToggle" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>

        <a href="index.html" class="navbar-logo">book<span>my</span>show</a>

        <button class="city-selector" id="citySelector" type="button">
          <span class="city-label">${savedCity}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
        </button>

        <div class="navbar-search">
          <input type="text" id="navSearchInput" placeholder="Search for movies, events, plays..." autocomplete="off" />
          <ul class="search-suggestions" id="navSuggestions"></ul>
        </div>

        <div class="navbar-actions">
          <a href="login.html" class="btn btn-outline">Sign In</a>
        </div>
      </div>
    </nav>
  `;

  setupCitySelector();
  setupSearchSuggestions();
  setupMenuToggle();
}

/**
 * Injects the shared footer markup into #footer.
 */
function renderFooter() {
  const mount = document.getElementById("footer");
  if (!mount) return;

  const year = new Date().getFullYear();

  mount.innerHTML = `
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-col">
          <h4>Company</h4>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><a href="movies.html">Movies</a></li>
            <li><a href="index.html">Events</a></li>
            <li><a href="index.html">Plays</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Account</h4>
          <ul>
            <li><a href="login.html">Sign In</a></li>
            <li><a href="signup.html">Sign Up</a></li>
            <li><a href="booking-history.html">My Bookings</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Terms of Use</a></li>
            <li><a href="#">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

    </footer>
  `;
}

/** Simple dropdown letting the user pick a dummy city; persists to localStorage. */
function setupCitySelector() {
  const btn = document.getElementById("citySelector");
  const label = btn?.querySelector(".city-label");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // Minimal frontend-only picker: cycle through the list on click.
    const current = label.textContent;
    const nextIndex = (CITIES.indexOf(current) + 1) % CITIES.length;
    const nextCity = CITIES[nextIndex];
    label.textContent = nextCity;
    localStorage.setItem("bms_city", nextCity);
  });
}

/** Queries movies + events for the navbar search box and renders a suggestion dropdown. */
function setupSearchSuggestions() {
  const input = document.getElementById("navSearchInput");
  const list = document.getElementById("navSuggestions");
  if (!input || !list) return;

  const search = debounce(async (rawQuery) => {
    const query = rawQuery.trim();

    if (!query) {
      list.classList.remove("active");
      list.innerHTML = "";
      return;
    }

    try {
      const suffix = `?q=${encodeURIComponent(query)}&limit=5`;
      const [movies, events] = await Promise.all([
        apiGet(`/movies${suffix}`),
        apiGet(`/events${suffix}`),
      ]);

      const matches = [
        ...movies.map((m) => ({ title: m.title, type: "Movie" })),
        ...events.map((e) => ({ title: e.title, type: "Event" })),
      ];

      list.innerHTML = matches.length
        ? matches
            .map(
              (item) => `
            <li>
              <a href="search-results.html?q=${encodeURIComponent(item.title)}">
                ${escapeHTML(item.title)}
                <span class="suggestion-type">${escapeHTML(item.type)}</span>
              </a>
            </li>`
            )
            .join("")
        : `<li><a href="search-results.html?q=${encodeURIComponent(query)}">No results for "${escapeHTML(query)}"</a></li>`;

      list.classList.add("active");
    } catch (err) {
      console.error(err);
      list.innerHTML = `<li><a href="#">Couldn't load suggestions</a></li>`;
      list.classList.add("active");
    }
  }, 250);

  input.addEventListener("input", () => search(input.value));

  // Close dropdown when clicking outside of it.
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar-search")) {
      list.classList.remove("active");
    }
  });
}

/**
 * Builds one media card's markup (movie or event) from a data item.
 * Shared by home.js and movies.js so card markup stays consistent.
 * Expects { title, meta, rating, poster, href }. `href` falls back to "#".
 * The card itself is the <a> (class stays "media-card" so existing CSS,
 * which targets the class not the tag, keeps working unchanged).
 */
function mediaCardHTML(item) {
  return `
    <a class="media-card" href="${escapeHTML(item.href || "#")}">
      <div class="media-card-poster" style="background-image:url('${escapeHTML(item.poster)}')">
        <span class="media-card-rating">&#9733; ${escapeHTML(String(item.rating))}</span>
      </div>
      <div class="media-card-body">
        <div class="media-card-title">${escapeHTML(item.title)}</div>
        <div class="media-card-meta">${escapeHTML(item.meta)}</div>
      </div>
    </a>
  `;
}

/** Renders a list of items into the card row with the given id. */
function renderCardRow(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(mediaCardHTML).join("");
}

/** Toggles a body class the mobile nav CSS can key off of. */
function setupMenuToggle() {
  const toggle = document.getElementById("menuToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    document.body.classList.toggle("nav-open");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNavbar();
  renderFooter();
});
