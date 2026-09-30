/* ==========================================================================
   booking.js
   Shared across seat-selection, booking-summary, payment, booking-confirmation.
   Seat Selection loads the show + seat map from the API (js/api.js) and
   hands off { showId, seatIds } to later pages via sessionStorage["bookingDraft"].
   ========================================================================== */

const MAX_SEATS_PER_BOOKING = 10;

let currentShowId = "";
let selectedSeats = []; // [{ id, label, category, price }]

/** Starts the Seat Selection page (does nothing on other pages). */
async function initSeatSelection() {
  const wrap = document.getElementById("seatLayout");
  if (!wrap) return;

  currentShowId = getQueryParam("showId");
  setupSeatLayoutDelegation();
  setupProceedButton();
  updateBookingBar();

  if (!currentShowId) {
    renderSeatMessage("No show selected. Please go back and pick a showtime.");
    return;
  }

  renderSeatMessage("Loading seats&hellip;");

  try {
    const [show, categories] = await Promise.all([
      apiGet(`/shows/${encodeURIComponent(currentShowId)}`),
      apiGet(`/shows/${encodeURIComponent(currentShowId)}/seats`),
    ]);
    renderShowHeader(show);
    renderSeatLayout(categories);
  } catch (err) {
    console.error(err);
    renderSeatMessage("Couldn't load seats. Please try again.");
  }
}

/** Fills the page header (movie, theatre, date/time, format) from the show summary. */
function renderShowHeader(show) {
  setText(document.getElementById("seatShowTitle"), show.movie?.title || "");
  const parts = [
    show.theatre?.name,
    [formatDate(show.showDate), show.showTime].filter(Boolean).join(", "),
    show.format,
  ].filter(Boolean);
  setText(document.getElementById("seatShowMeta"), parts.join(" • "));
}

/** Replaces the seat layout with a plain status message (loading/empty/error). */
function renderSeatMessage(message) {
  const wrap = document.getElementById("seatLayout");
  if (wrap) wrap.innerHTML = `<p class="list-message">${message}</p>`;
}

/** Builds the seat grid markup from GET /shows/:id/seats' grouped categories. */
function renderSeatLayout(categories) {
  const wrap = document.getElementById("seatLayout");
  if (!wrap) return;

  wrap.innerHTML = categories.map((category) => `
    <div class="seat-category">
      <div class="seat-category-label">${escapeHTML(category.category)}</div>
      <div class="seat-category-price">${formatRupees(category.price)} per ticket</div>
      ${category.rows
        .map(
          (row) => `
        <div class="seat-row">
          <span class="seat-row-label">${escapeHTML(row.row)}</span>
          <div class="seat-row-seats">
            ${row.seats
              .map((seat) => {
                const booked = seat.status === "booked";
                return `<button type="button" class="seat${booked ? " booked" : ""}"
                          data-id="${escapeHTML(seat.id)}" data-label="${escapeHTML(row.row + seat.number)}"
                          data-category="${escapeHTML(category.category)}" data-price="${category.price}"
                          ${booked ? "disabled" : ""}>${seat.number}</button>`;
              })
              .join("")}
          </div>
        </div>`
        )
        .join("")}
    </div>
  `).join("");
}

/** One delegated click handler for the whole seat grid (set up once, survives re-renders). */
function setupSeatLayoutDelegation() {
  const wrap = document.getElementById("seatLayout");
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const seatEl = e.target.closest(".seat");
    if (!seatEl || seatEl.classList.contains("booked")) return;
    toggleSeat(seatEl);
  });
}

/** Selects/deselects a single seat (capped at MAX_SEATS_PER_BOOKING) and refreshes the summary bar. */
function toggleSeat(seatEl) {
  const id = seatEl.dataset.id;
  const isSelected = seatEl.classList.contains("selected");

  if (!isSelected && selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
    return; // display-only cap; the server enforces this for real
  }

  seatEl.classList.toggle("selected");

  if (!isSelected) {
    selectedSeats.push({
      id,
      label: seatEl.dataset.label,
      category: seatEl.dataset.category,
      price: Number(seatEl.dataset.price),
    });
  } else {
    selectedSeats = selectedSeats.filter((s) => s.id !== id);
  }

  updateBookingBar();
}

/** Recomputes the live (display-only) total and enables/disables the Proceed button. */
function updateBookingBar() {
  const countLabel = document.getElementById("seatCountLabel");
  const totalLabel = document.getElementById("seatTotalLabel");
  const proceedBtn = document.getElementById("proceedBtn");
  if (!countLabel) return;

  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  countLabel.textContent = `${selectedSeats.length} Ticket${selectedSeats.length === 1 ? "" : "s"}`;
  totalLabel.textContent = formatRupees(total);
  if (proceedBtn) proceedBtn.disabled = selectedSeats.length === 0;
}

/** Persists { showId, seatIds } for booking-summary.html to read, then navigates. */
function setupProceedButton() {
  const proceedBtn = document.getElementById("proceedBtn");
  if (!proceedBtn) return;

  proceedBtn.addEventListener("click", () => {
    if (selectedSeats.length === 0) return;
    const draft = { showId: currentShowId, seatIds: selectedSeats.map((s) => s.id) };
    sessionStorage.setItem("bookingDraft", JSON.stringify(draft));
    window.location.href = "booking-summary.html";
  });
}

/* ==========================================================================
   Booking Summary page
   Prices are never computed on the client — this page only displays the
   numbers POST /bookings/preview returns for the draft's {showId, seatIds}.
   ========================================================================== */

/** Reads the {showId, seatIds} draft seat-selection.html saved. Null if missing/invalid. */
function loadBookingDraft() {
  try {
    const draft = JSON.parse(sessionStorage.getItem("bookingDraft"));
    if (!draft || !draft.showId || !Array.isArray(draft.seatIds) || draft.seatIds.length === 0) {
      return null;
    }
    return draft;
  } catch {
    return null;
  }
}

/** Replaces the summary cards with a message and hides the sticky bar. */
function renderSummaryMessage(message) {
  const layout = document.querySelector(".summary-layout");
  if (layout) layout.innerHTML = `<p class="list-message">${message}</p>`;
  const bar = document.querySelector(".booking-bar");
  if (bar) bar.hidden = true;
}

/** Fills the summary page from a POST /bookings/preview response. */
function renderSummaryPreview(preview) {
  const { show, seats, ticketCount, ticketTotal, convenienceFee, gst, grandTotal } = preview;

  const poster = document.getElementById("summaryPoster");
  if (poster) {
    poster.src = show.movie?.poster || "";
    poster.alt = `${show.movie?.title || ""} poster`;
  }

  setText(document.getElementById("summaryMovieTitle"), show.movie?.title || "");
  setText(document.getElementById("summaryMetaLine"), [show.language, show.format].filter(Boolean).join(" • "));
  setText(document.getElementById("summaryVenue"), show.theatre?.name || "");
  setText(document.getElementById("showDateTime"), [formatDate(show.showDate), show.showTime].filter(Boolean).join(", "));

  const chipRow = document.getElementById("seatChipRow");
  if (chipRow) {
    chipRow.innerHTML = seats.length
      ? seats.map((label) => `<span class="seat-chip">${escapeHTML(label)}</span>`).join("")
      : `<span class="details-meta-line-dark">No seats selected.</span>`;
  }

  setText(document.getElementById("ticketCountLabel"), `${ticketCount} Ticket${ticketCount === 1 ? "" : "s"}`);
  setText(document.getElementById("subtotalLabel"), formatRupees(ticketTotal));
  setText(document.getElementById("convenienceFeeLabel"), formatRupees(convenienceFee));
  setText(document.getElementById("gstLabel"), formatRupees(gst));
  setText(document.getElementById("grandTotalLabel"), formatRupees(grandTotal));

  setText(document.getElementById("barTicketCountLabel"), `${ticketCount} Ticket${ticketCount === 1 ? "" : "s"}`);
  setText(document.getElementById("barTotalLabel"), formatRupees(grandTotal));

  const proceedBtn = document.getElementById("proceedToPaymentBtn");
  if (proceedBtn) {
    proceedBtn.disabled = false;
    proceedBtn.onclick = () => {
      window.location.href = "payment.html";
    };
  }
}

async function setupBookingSummaryPage() {
  if (!document.getElementById("seatChipRow")) return;

  const draft = loadBookingDraft();
  if (!draft) {
    renderSummaryMessage('No seats selected yet. <a href="movies.html">Browse movies</a> to start a booking.');
    return;
  }

  try {
    const preview = await apiPost('/bookings/preview', draft);
    renderSummaryPreview(preview);
  } catch (err) {
    console.error(err);
    if (err.status === 409) {
      renderSummaryMessage('Sorry, one or more of your seats were just booked. <a href="seat-selection.html?showId=' + encodeURIComponent(draft.showId) + '">Go back and pick different seats</a>.');
    } else {
      renderSummaryMessage("Couldn't load your booking summary. Please try again.");
    }
  }
}

/* ==========================================================================
   Payment page
   ========================================================================== */

/** Switches the active method button and reveals its dummy form fields. */
function setupPaymentMethodSelection() {
  const wrap = document.getElementById("paymentMethods");
  if (!wrap) return;

  wrap.querySelectorAll(".payment-method").forEach((btn) => {
    btn.addEventListener("click", () => {
      wrap.querySelectorAll(".payment-method").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const method = btn.dataset.method;
      document.querySelectorAll(".payment-form").forEach((form) => {
        form.hidden = form.dataset.form !== method;
      });
    });
  });
}

// Maps the existing payment-method buttons' data-method to the API's enum.
const PAYMENT_METHOD_BY_BUTTON = {
  upi: 'UPI',
  credit: 'Credit Card',
  debit: 'Debit Card',
  netbanking: 'Net Banking',
  wallet: 'Wallet',
};

/** Replaces the payment layout with a message and hides the sticky pay bar. */
function renderPaymentMessage(message) {
  const layout = document.querySelector(".payment-layout");
  if (layout) layout.innerHTML = `<p class="list-message">${message}</p>`;
  const bar = document.querySelector(".booking-bar");
  if (bar) bar.hidden = true;
}

/** Wires the Pay Now button: reads the active method, POSTs the booking, redirects. */
function setupPayNowButton(draft) {
  const btn = document.getElementById("payNowBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const activeMethodBtn = document.querySelector(".payment-method.active");
    const paymentMethod = PAYMENT_METHOD_BY_BUTTON[activeMethodBtn?.dataset.method] || 'UPI';

    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Processing…";

    try {
      const booking = await apiPost('/bookings', {
        showId: draft.showId,
        seatIds: draft.seatIds,
        paymentMethod,
      });
      sessionStorage.removeItem("bookingDraft");
      window.location.href = `booking-confirmation.html?bookingId=${encodeURIComponent(booking.bookingId)}`;
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      btn.textContent = originalText;
      const message = err.status === 409
        ? 'Sorry, one or more of your seats were just booked. <a href="seat-selection.html?showId=' + encodeURIComponent(draft.showId) + '">Go back and pick different seats</a>.'
        : "Payment failed. Please try again.";
      renderPaymentMessage(message);
    }
  });
}

/** Loads the draft, shows the real amount payable via a fresh preview, and wires Pay Now. */
async function setupPaymentPage() {
  if (!document.getElementById("paymentMethods")) return;
  setupPaymentMethodSelection();

  const draft = loadBookingDraft();
  if (!draft) {
    renderPaymentMessage('No booking in progress. <a href="movies.html">Browse movies</a> to start one.');
    return;
  }

  try {
    const preview = await apiPost('/bookings/preview', draft);
    setText(document.getElementById("payAmountLabel"), formatRupees(preview.grandTotal));
    setupPayNowButton(draft);
  } catch (err) {
    console.error(err);
    if (err.status === 409) {
      renderPaymentMessage('Sorry, one or more of your seats were just booked. <a href="seat-selection.html?showId=' + encodeURIComponent(draft.showId) + '">Go back and pick different seats</a>.');
    } else {
      renderPaymentMessage("Couldn't load payment details. Please try again.");
    }
  }
}

/* ==========================================================================
   Booking Confirmation page
   ========================================================================== */

/** Fills the confirmation card from GET /bookings/:id. */
function renderConfirmationDetails(booking) {
  setText(document.getElementById("bookingIdLabel"), booking.id);
  setText(document.getElementById("confirmationMovie"), booking.show?.movie?.title || "—");
  setText(document.getElementById("confirmationTheatre"), booking.show?.theatre?.name || "—");
  setText(
    document.getElementById("confirmationDateTime"),
    [formatDate(booking.show?.showDate), booking.show?.showTime].filter(Boolean).join(", ") || "—"
  );
  setText(document.getElementById("confirmationSeats"), booking.seats?.length ? booking.seats.join(", ") : "—");
  setText(document.getElementById("confirmationAmount"), formatRupees(booking.amount));
}

/** Replaces the confirmation card with a "not found" message. */
function renderBookingNotFound() {
  const card = document.querySelector(".confirmation-card");
  if (card) {
    card.innerHTML = `
      <h1>Booking not found</h1>
      <p class="details-meta-line-dark">We couldn't find this booking. Double-check the link, or view your bookings below.</p>
      <a href="booking-history.html" class="btn btn-primary btn-block">View My Bookings</a>
    `;
  }
}

/** Copies the booking ID to the clipboard and flashes a "Copied" state. */
function setupCopyBookingId() {
  const btn = document.getElementById("copyBookingIdBtn");
  const idLabel = document.getElementById("bookingIdLabel");
  if (!btn || !idLabel) return;

  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(idLabel.textContent);
    } catch {
      // Clipboard API may be unavailable (e.g. non-secure context) — fail silently.
    }
    const originalText = btn.textContent;
    btn.textContent = "Copied!";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = originalText;
      btn.classList.remove("copied");
    }, 1500);
  });
}

/** Loads the booking by ?bookingId= from the URL and fills the confirmation card. */
async function setupConfirmationPage() {
  if (!document.getElementById("bookingIdLabel")) return;

  const bookingId = getQueryParam("bookingId");
  if (!bookingId) {
    renderBookingNotFound();
    return;
  }

  try {
    const booking = await apiGet(`/bookings/${encodeURIComponent(bookingId)}`);
    renderConfirmationDetails(booking);
    setupCopyBookingId();
  } catch (err) {
    console.error(err);
    renderBookingNotFound();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initSeatSelection();

  setupBookingSummaryPage();

  setupPaymentPage();

  setupConfirmationPage();
});
