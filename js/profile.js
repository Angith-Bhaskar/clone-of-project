/* ==========================================================================
   profile.js
   Shared across profile, booking-history.
   Currently implements: My Profile page (frontend-only edit mode — nothing
   is persisted to a backend; "saved" values just stay in the DOM/session).
   ========================================================================== */

/* ---- My Profile page ------------------------------------------------------- */

function setupProfileEditMode() {
  const form = document.getElementById("profileForm");
  if (!form) return;

  const inputs = form.querySelectorAll("input");
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelEditBtn");
  const changePhotoBtn = document.getElementById("changePhotoBtn");
  const saveNote = document.getElementById("profileSaveNote");

  let previousValues = [];

  function enterEditMode() {
    previousValues = [...inputs].map((input) => input.value);
    inputs.forEach((input) => (input.disabled = false));
    editBtn.hidden = true;
    saveBtn.hidden = false;
    cancelBtn.hidden = false;
    changePhotoBtn.hidden = false;
    saveNote.hidden = true;
  }

  function exitEditMode() {
    inputs.forEach((input) => (input.disabled = true));
    editBtn.hidden = false;
    saveBtn.hidden = true;
    cancelBtn.hidden = true;
    changePhotoBtn.hidden = true;
  }

  editBtn.addEventListener("click", enterEditMode);

  cancelBtn.addEventListener("click", () => {
    inputs.forEach((input, i) => (input.value = previousValues[i]));
    exitEditMode();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Frontend-only "save" — no backend call, values simply stay as edited.
    exitEditMode();
    saveNote.hidden = false;
  });

  changePhotoBtn.addEventListener("click", () => {
    alert("Demo only: photo upload is not wired up to a backend.");
  });
}

/* ---- Booking History page --------------------------------------------------- */

/** Dummy past/upcoming bookings (hardcoded, no backend). */
const BOOKING_HISTORY = [
  { title: "The Last Signal", theatre: "PVR Cinemas: Phoenix Mall", date: "12 Aug 2026, 8:30 PM", seats: "A3, A4", status: "upcoming", poster: "https://images.unsplash.com/photo-1517602302552-471fe67acf66?w=200&q=80" },
  { title: "Fireheart", theatre: "INOX: R-City", date: "02 Jul 2026, 6:00 PM", seats: "C5, C6", status: "completed", poster: "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=200&q=80" },
  { title: "Silent Tide", theatre: "Cinepolis: Fun Republic", date: "18 Jun 2026, 3:30 PM", seats: "F10", status: "completed", poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200&q=80" },
  { title: "Midnight Runners", theatre: "PVR Cinemas: Phoenix Mall", date: "05 Jun 2026, 9:00 PM", seats: "B1, B2", status: "cancelled", poster: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=200&q=80" },
  { title: "Winter's Edge", theatre: "INOX: R-City", date: "22 May 2026, 5:00 PM", seats: "D4", status: "completed", poster: "https://images.unsplash.com/photo-1499364615650-ec38552f4f34?w=200&q=80" },
];

/** Renders the given bookings into the list, or the empty state if none match. */
function renderBookingList(bookings) {
  const list = document.getElementById("bookingList");
  const emptyState = document.getElementById("historyEmptyState");
  if (!list) return;

  list.innerHTML = bookings
    .map(
      (b) => `
      <article class="booking-item">
        <img class="booking-item-poster" src="${b.poster}" alt="${b.title} poster" />
        <div class="booking-item-info">
          <div class="booking-item-title-row">
            <span class="booking-item-title">${b.title}</span>
            <span class="status-badge ${b.status}">${b.status}</span>
          </div>
          <p class="booking-item-meta">${b.theatre}</p>
          <p class="booking-item-meta">${b.date} &bull; Seats: ${b.seats}</p>
        </div>
      </article>`
    )
    .join("");

  emptyState.hidden = bookings.length !== 0;
}

/** Wires the status filter pills (All / Upcoming / Completed / Cancelled). */
function setupBookingHistoryFilters() {
  const filterBar = document.getElementById("historyFilters");
  if (!filterBar) return;

  filterBar.querySelectorAll(".history-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBar.querySelectorAll(".history-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const status = btn.dataset.status;
      const filtered =
        status === "all" ? BOOKING_HISTORY : BOOKING_HISTORY.filter((b) => b.status === status);
      renderBookingList(filtered);
    });
  });

  renderBookingList(BOOKING_HISTORY);
}

document.addEventListener("DOMContentLoaded", () => {
  setupProfileEditMode();
  setupBookingHistoryFilters();
});
