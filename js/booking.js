/* ==========================================================================
   booking.js
   Shared across booking-summary, payment, booking-confirmation.
   (Seat Selection is now a React page: react-app/src/seat-selection.)
   The Seat Selection page hands off { showId, seatIds } to these pages via
   sessionStorage["bookingDraft"].
   ========================================================================== */

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
  renderCancellationState(booking.bookingStatus);
}

/** Switches the confirmation card between "confirmed" and "cancelled" wording and shows Cancel only while upcoming. */
function renderCancellationState(status) {
  const cancelled = status === "cancelled";
  setText(document.getElementById("confirmationTitle"), cancelled ? "Booking Cancelled" : "Booking Confirmed!");
  setText(
    document.getElementById("confirmationSubtitle"),
    cancelled ? "This booking was cancelled and your payment has been refunded." : "Your tickets are booked. Enjoy the show!"
  );
  setText(document.querySelector(".confirmation-row:last-child .confirmation-label"), cancelled ? "Amount Refunded" : "Amount Paid");

  const cancelBtn = document.getElementById("cancelBookingBtn");
  if (cancelBtn) cancelBtn.hidden = status !== "upcoming";
}

/** Cancel Booking button: confirm, call PATCH /bookings/:id/cancel, then update the page in place. */
function setupCancelBooking(bookingId) {
  const btn = document.getElementById("cancelBookingBtn");
  const message = document.getElementById("cancelMessage");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    if (!window.confirm("Cancel this booking? Your seats will be released and the amount refunded.")) return;

    message.textContent = "";
    btn.disabled = true;
    btn.textContent = "Cancelling…";
    try {
      await apiRequest("PATCH", `/bookings/${encodeURIComponent(bookingId)}/cancel`, {});
      renderCancellationState("cancelled");
    } catch (err) {
      message.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.textContent = "Cancel Booking";
    }
  });
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
    setupCancelBooking(bookingId);
  } catch (err) {
    console.error(err);
    renderBookingNotFound();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Summary, payment and confirmation pages are for logged-in users only.
  const loginOnly = ["booking-summary.html", "payment.html", "booking-confirmation.html"];
  if (loginOnly.some((page) => window.location.pathname.endsWith(page)) && !requireLogin()) return;

  setupBookingSummaryPage();

  setupPaymentPage();

  setupConfirmationPage();
});
