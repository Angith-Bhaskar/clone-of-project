/* ==========================================================================
   home.js
   Home-page-only behavior: banner carousel (static) + five card rows loaded
   from the API (js/api.js: apiGet, movieToCard, eventToCard), each
   independently so one row failing doesn't blank the others.
   Relies on js/common.js already having run (navbar/footer injected,
   mediaCardHTML()/renderCardRow() available).
   ========================================================================== */

/** Loads one card row: shows a loading message, then the mapped cards, an
 *  empty message, or an error message — never leaves the row blank. */
async function loadHomeRow(containerId, fetchItems, mapItem) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<p class="list-message">Loading&hellip;</p>`;

  try {
    const items = await fetchItems();
    if (items.length === 0) {
      el.innerHTML = `<p class="list-message">Nothing to show right now.</p>`;
      return;
    }
    renderCardRow(containerId, items.map(mapItem));
  } catch (err) {
    console.error(err);
    el.innerHTML = `<p class="list-message">Couldn't load this section. Please try again later.</p>`;
  }
}

/* ---- Banner carousel ------------------------------------------------------ */
function setupBannerCarousel() {
  const track = document.getElementById("bannerTrack");
  const dotsWrap = document.getElementById("bannerDots");
  const prevBtn = document.getElementById("bannerPrev");
  const nextBtn = document.getElementById("bannerNext");
  if (!track || !dotsWrap) return;

  const slideCount = track.children.length;
  let current = 0;
  let autoTimer = null;

  // Build one dot per slide.
  for (let i = 0; i < slideCount; i++) {
    const dot = document.createElement("button");
    dot.className = "banner-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsWrap.appendChild(dot);
  }

  function goTo(index) {
    current = (index + slideCount) % slideCount;
    track.style.transform = `translateX(-${current * 100}%)`;
    [...dotsWrap.children].forEach((dot, i) =>
      dot.classList.toggle("active", i === current)
    );
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAutoPlay() {
    autoTimer = setInterval(next, 4500);
  }

  function stopAutoPlay() {
    clearInterval(autoTimer);
  }

  prevBtn.addEventListener("click", () => {
    prev();
    stopAutoPlay();
    startAutoPlay();
  });

  nextBtn.addEventListener("click", () => {
    next();
    stopAutoPlay();
    startAutoPlay();
  });

  // Pause on hover so users can read the banner without it jumping.
  const banner = track.closest(".banner");
  banner.addEventListener("mouseenter", stopAutoPlay);
  banner.addEventListener("mouseleave", startAutoPlay);

  startAutoPlay();
}

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("bannerTrack")) return; // not the home page
  setupBannerCarousel();

  loadHomeRow("recommendedMovies", () => apiGet("/movies?limit=8"), movieToCard);
  loadHomeRow("liveEvents", () => apiGet("/events?category=live"), eventToCard);
  loadHomeRow("premieres", () => apiGet("/events?category=premiere"), eventToCard);
  loadHomeRow("outdoorEvents", () => apiGet("/events?category=outdoor"), eventToCard);
  loadHomeRow("laughterShows", () => apiGet("/events?category=laughter"), eventToCard);
});
