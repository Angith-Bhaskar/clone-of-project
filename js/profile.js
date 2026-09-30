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

/** Renders bookings from GET /bookings into the list, each linking to its confirmation page. */
function renderBookingList(bookings) {
  const list = document.getElementById("bookingList");
  const emptyState = document.getElementById("historyEmptyState");
  if (!list) return;

  list.innerHTML = bookings
    .map((b) => {
      const dateTime = [formatDate(b.showDate), b.showTime].filter(Boolean).join(", ");
      return `
      <a class="booking-item" href="booking-confirmation.html?bookingId=${encodeURIComponent(b.id)}">
        <img class="booking-item-poster" src="${escapeHTML(b.movie?.poster || "")}" alt="${escapeHTML(b.movie?.title || "")} poster" />
        <div class="booking-item-info">
          <div class="booking-item-title-row">
            <span class="booking-item-title">${escapeHTML(b.movie?.title || "")}</span>
            <span class="status-badge ${escapeHTML(b.status)}">${escapeHTML(b.status)}</span>
          </div>
          <p class="booking-item-meta">${escapeHTML(b.theatre?.name || "")}</p>
          <p class="booking-item-meta">${escapeHTML(dateTime)} &bull; ${b.seatCount} seat${b.seatCount === 1 ? "" : "s"} &bull; ${formatRupees(b.amount)}</p>
        </div>
      </a>`;
    })
    .join("");

  if (emptyState) emptyState.hidden = bookings.length !== 0;
}

/** Fetches GET /bookings?status= (server-side filter) and renders the result. */
async function loadBookingHistory(status) {
  const list = document.getElementById("bookingList");
  const emptyState = document.getElementById("historyEmptyState");
  if (!list) return;

  list.innerHTML = `<p class="list-message">Loading your bookings&hellip;</p>`;
  if (emptyState) emptyState.hidden = true;

  try {
    const suffix = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    const bookings = await apiGet(`/bookings${suffix}`);
    renderBookingList(bookings);
  } catch (err) {
    console.error(err);
    list.innerHTML = `<p class="list-message">Couldn't load your bookings. Please try again.</p>`;
    if (emptyState) emptyState.hidden = true;
  }
}

/** Wires the status filter pills (All / Upcoming / Completed / Cancelled); each re-queries the server. */
function setupBookingHistoryFilters() {
  const filterBar = document.getElementById("historyFilters");
  if (!filterBar) return;

  filterBar.querySelectorAll(".history-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBar.querySelectorAll(".history-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadBookingHistory(btn.dataset.status);
    });
  });

  loadBookingHistory("all");
}

document.addEventListener("DOMContentLoaded", () => {
  setupProfileEditMode();
  setupBookingHistoryFilters();
});
