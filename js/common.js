/* ==========================================================================
   common.js
   Shared across all pages: navbar/footer injection, city selector,
   dummy search suggestions, responsive menu toggle.
   Loaded on every page (after common.css, before the page-specific JS file).
   ========================================================================== */

/* Dummy city list used by the city selector dropdown (frontend-only). */
const CITIES = [
  "Mumbai", "Delhi-NCR", "Bengaluru", "Hyderabad",
  "Ahmedabad", "Chandigarh", "Chennai", "Pune", "Kolkata", "Kochi"
];

/* Dummy dataset the search bar suggests against (movies + events).
   Real filtering happens per-page (movies.js / home.js); common.js only
   renders the shared suggestions dropdown used in the navbar. */
const SEARCH_INDEX = [
  { title: "Fireheart", type: "Movie" },
  { title: "Silent Tide", type: "Movie" },
  { title: "The Last Signal", type: "Movie" },
  { title: "Comedy Nights Live", type: "Event" },
  { title: "Neon Dreams Tour", type: "Event" },
  { title: "Midnight Runners", type: "Movie" },
  { title: "Stand-Up Saturdays", type: "Event" },
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

/** Filters SEARCH_INDEX against the navbar input and renders a dropdown. */
function setupSearchSuggestions() {
  const input = document.getElementById("navSearchInput");
  const list = document.getElementById("navSuggestions");
  if (!input || !list) return;

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();

    if (!query) {
      list.classList.remove("active");
      list.innerHTML = "";
      return;
    }

    const matches = SEARCH_INDEX.filter((item) =>
      item.title.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      list.innerHTML = `<li><a href="#">No results for "${query}"</a></li>`;
    } else {
      list.innerHTML = matches
        .map(
          (item) => `
            <li>
              <a href="search-results.html?q=${encodeURIComponent(item.title)}">
                ${item.title}
                <span class="suggestion-type">${item.type}</span>
              </a>
            </li>`
        )
        .join("");
    }

    list.classList.add("active");
  });

  // Close dropdown when clicking outside of it.
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".navbar-search")) {
      list.classList.remove("active");
    }
  });
}

/**
 * Builds one media card's markup (movie or event) from a dummy data item.
 * Shared by home.js and movies.js so card markup stays consistent.
 * Expects { title, meta, rating, poster }.
 */
function mediaCardHTML(item) {
  return `
    <article class="media-card">
      <div class="media-card-poster" style="background-image:url('${item.poster}')">
        <span class="media-card-rating">&#9733; ${item.rating}</span>
      </div>
      <div class="media-card-body">
        <div class="media-card-title">${item.title}</div>
        <div class="media-card-meta">${item.meta}</div>
      </div>
    </article>
  `;
}

/** Renders a list of dummy items into the card row with the given id. */
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
