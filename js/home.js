/* ==========================================================================
   home.js
   Home-page-only behavior: banner carousel, dummy movie/event card rows.
   Relies on js/common.js already having run (navbar/footer injected).
   ========================================================================== */

/* ---- Dummy data (hardcoded, no backend) --------------------------------- */

const RECOMMENDED_MOVIES = [
  { title: "Fireheart", meta: "Action, Thriller | UA", rating: "8.2", poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=400&q=80" },
  { title: "Silent Tide", meta: "Drama | U", rating: "7.6", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&q=80" },
  { title: "The Last Signal", meta: "Sci-Fi | UA", rating: "8.9", poster: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=400&q=80" },
  { title: "Midnight Runners", meta: "Action, Comedy | UA", rating: "7.4", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=400&q=80" },
  { title: "Crimson Sky", meta: "Adventure | U", rating: "8.0", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80" },
  { title: "Echoes of Us", meta: "Romance, Drama | UA", rating: "7.9", poster: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&q=80" },
];

const LIVE_EVENTS = [
  { title: "Comedy Nights Live", meta: "Stand-up | Mumbai", rating: "8.5", poster: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80" },
  { title: "Neon Dreams Tour", meta: "Music Concert | Delhi", rating: "9.0", poster: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=80" },
  { title: "Jazz Under Stars", meta: "Music | Bengaluru", rating: "8.1", poster: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80" },
  { title: "Indie Beats Fest", meta: "Music Festival | Pune", rating: "7.8", poster: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&q=80" },
];

const PREMIERES = [
  { title: "Winter's Edge", meta: "Thriller | UA", rating: "8.3", poster: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=400&q=80" },
  { title: "The Glass House", meta: "Mystery | UA", rating: "7.7", poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80" },
  { title: "Beyond the Ridge", meta: "Adventure | U", rating: "8.4", poster: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&q=80" },
  { title: "Paper Moon", meta: "Drama | U", rating: "7.5", poster: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=400&q=80" },
];

const OUTDOOR_EVENTS = [
  { title: "Street Food Carnival", meta: "Food Fest | Chennai", rating: "8.6", poster: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80" },
  { title: "Kite Flying Festival", meta: "Outdoor | Ahmedabad", rating: "8.0", poster: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=400&q=80" },
  { title: "Adventure Park Meet", meta: "Outdoor | Pune", rating: "7.9", poster: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&q=80" },
];

const LAUGHTER_SHOWS = [
  { title: "Stand-Up Saturdays", meta: "Comedy | Mumbai", rating: "8.7", poster: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&q=80" },
  { title: "The Roast Room", meta: "Comedy | Delhi", rating: "8.2", poster: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&q=80" },
  { title: "Laugh Riot Live", meta: "Comedy | Bengaluru", rating: "7.9", poster: "https://images.unsplash.com/photo-1543584756-83fb9df58ec4?w=400&q=80" },
];

/* mediaCardHTML() / renderCardRow() live in common.js — shared with movies.js. */

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
  setupBannerCarousel();
  renderCardRow("recommendedMovies", RECOMMENDED_MOVIES);
  renderCardRow("liveEvents", LIVE_EVENTS);
  renderCardRow("premieres", PREMIERES);
  renderCardRow("outdoorEvents", OUTDOOR_EVENTS);
  renderCardRow("laughterShows", LAUGHTER_SHOWS);
});
