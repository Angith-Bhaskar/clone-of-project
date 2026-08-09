/* ==========================================================================
   booking.js
   Shared across seat-selection, booking-summary, payment, booking-confirmation.
   Currently implements: Seat Selection page (select/deselect seats, live
   total). Selection is handed off to later booking pages via
   sessionStorage — still entirely frontend, no backend involved.
   ========================================================================== */

/* ---- Dummy seat map (hardcoded, no backend) ------------------------------
   A handful of seats per row are pre-marked "booked" so the booked state
   has something to show. */

const SEAT_CATEGORIES = [
  { name: "Platinum", price: 350, rows: ["A", "B"], seatsPerRow: 10 },
  { name: "Gold", price: 250, rows: ["C", "D", "E"], seatsPerRow: 10 },
  { name: "Silver", price: 150, rows: ["F", "G", "H"], seatsPerRow: 12 },
];

/** Deterministic-looking "already booked" seats, just for visual variety. */
const BOOKED_SEATS = new Set(["A3", "A4", "C7", "D2", "D3", "F10", "G1", "G2", "H11"]);

let selectedSeats = []; // [{ id, category, price }]

/** Builds the seat grid markup for every category and wires click handlers. */
function renderSeatLayout() {
  const wrap = document.getElementById("seatLayout");
  if (!wrap) return;

  wrap.innerHTML = SEAT_CATEGORIES.map((category) => `
    <div class="seat-category">
      <div class="seat-category-label">${category.name}</div>
      <div class="seat-category-price">₹${category.price} per ticket</div>
      ${category.rows
        .map(
          (row) => `
        <div class="seat-row">
          <span class="seat-row-label">${row}</span>
          <div class="seat-row-seats">
            ${Array.from({ length: category.seatsPerRow }, (_, i) => {
              const num = i + 1;
              const id = `${row}${num}`;
              const booked = BOOKED_SEATS.has(id);
              return `<button type="button" class="seat${booked ? " booked" : ""}"
                        data-id="${id}" data-category="${category.name}" data-price="${category.price}"
                        ${booked ? "disabled" : ""}>${num}</button>`;
            }).join("")}
          </div>
        </div>`
        )
        .join("")}
    </div>
  `).join("");

  wrap.querySelectorAll(".seat:not(.booked)").forEach((seatEl) => {
    seatEl.addEventListener("click", () => toggleSeat(seatEl));
  });
}

/** Selects/deselects a single seat and refreshes the summary bar. */
function toggleSeat(seatEl) {
  const id = seatEl.dataset.id;
  const isSelected = seatEl.classList.toggle("selected");

  if (isSelected) {
    selectedSeats.push({
      id,
      category: seatEl.dataset.category,
      price: Number(seatEl.dataset.price),
    });
  } else {
    selectedSeats = selectedSeats.filter((s) => s.id !== id);
  }

  updateBookingBar();
}

/** Recomputes the live total and enables/disables the Proceed button. */
function updateBookingBar() {
  const countLabel = document.getElementById("seatCountLabel");
  const totalLabel = document.getElementById("seatTotalLabel");
  const proceedBtn = document.getElementById("proceedBtn");
  if (!countLabel) return;

  const total = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  countLabel.textContent = `${selectedSeats.length} Ticket${selectedSeats.length === 1 ? "" : "s"}`;
  totalLabel.textContent = `₹${total}`;
  proceedBtn.disabled = selectedSeats.length === 0;
}

/** Persists the selection so booking-summary.html can read it, then navigates. */
function setupProceedButton() {
  const proceedBtn = document.getElementById("proceedBtn");
  if (!proceedBtn) return;

  proceedBtn.addEventListener("click", () => {
    if (selectedSeats.length === 0) return;
    sessionStorage.setItem("bms_selected_seats", JSON.stringify(selectedSeats));
    window.location.href = "booking-summary.html";
  });
}

/* ==========================================================================
   Booking Summary page
   ========================================================================== */

const CONVENIENCE_FEE_PER_TICKET = 30;
const GST_RATE = 0.18;

/** Loads the seat selection handed off from seat-selection.html. */
function loadSelectedSeats() {
  try {
    return JSON.parse(sessionStorage.getItem("bms_selected_seats")) || [];
  } catch {
    return [];
  }
}

/** Renders removable seat chips from the current `selectedSeats` list. */
function renderSeatChips() {
  const wrap = document.getElementById("seatChipRow");
  if (!wrap) return;

  wrap.innerHTML = selectedSeats.length
    ? selectedSeats
        .map(
          (s) => `
      <span class="seat-chip" data-id="${s.id}">
        ${s.id} <small>(${s.category})</small>
        <button type="button" class="remove-seat-btn" data-id="${s.id}" aria-label="Remove seat ${s.id}">&times;</button>
      </span>`
        )
        .join("")
    : `<span class="details-meta-line-dark">No seats selected.</span>`;

  wrap.querySelectorAll(".remove-seat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedSeats = selectedSeats.filter((s) => s.id !== btn.dataset.id);
      sessionStorage.setItem("bms_selected_seats", JSON.stringify(selectedSeats));
      renderSeatChips();
      updateSummaryBreakdown();
    });
  });
}

/** Recomputes subtotal / convenience fee / GST / grand total and updates the DOM. */
function updateSummaryBreakdown() {
  const ticketCountLabel = document.getElementById("ticketCountLabel");
  if (!ticketCountLabel) return;

  const count = selectedSeats.length;
  const subtotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const convenienceFee = count * CONVENIENCE_FEE_PER_TICKET;
  const gst = Math.round((subtotal + convenienceFee) * GST_RATE);
  const grandTotal = subtotal + convenienceFee + gst;

  ticketCountLabel.textContent = `${count} Ticket${count === 1 ? "" : "s"}`;
  document.getElementById("subtotalLabel").textContent = `₹${subtotal}`;
  document.getElementById("convenienceFeeLabel").textContent = `₹${convenienceFee}`;
  document.getElementById("gstLabel").textContent = `₹${gst}`;
  document.getElementById("grandTotalLabel").textContent = `₹${grandTotal}`;

  document.getElementById("barTicketCountLabel").textContent = `${count} Ticket${count === 1 ? "" : "s"}`;
  document.getElementById("barTotalLabel").textContent = `₹${grandTotal}`;
  document.getElementById("proceedToPaymentBtn").disabled = count === 0;

  return { count, subtotal, convenienceFee, gst, grandTotal };
}

function setupProceedToPaymentButton() {
  const btn = document.getElementById("proceedToPaymentBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (selectedSeats.length === 0) return;
    const breakdown = updateSummaryBreakdown();
    sessionStorage.setItem("bms_price_breakdown", JSON.stringify(breakdown));
    window.location.href = "payment.html";
  });
}

function setupBookingSummaryPage() {
  if (!document.getElementById("seatChipRow")) return;
  selectedSeats = loadSelectedSeats();
  renderSeatChips();
  updateSummaryBreakdown();
  setupProceedToPaymentButton();
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

/** Shows the amount payable from the breakdown saved on Booking Summary. */
function renderPayAmount() {
  const label = document.getElementById("payAmountLabel");
  if (!label) return;

  let breakdown = null;
  try {
    breakdown = JSON.parse(sessionStorage.getItem("bms_price_breakdown"));
  } catch {
    breakdown = null;
  }

  label.textContent = `₹${breakdown?.grandTotal ?? 0}`;
}

/** Generates a short dummy booking ID (frontend-only, no backend). */
function generateBookingId() {
  return "BMS" + Math.random().toString(36).slice(2, 9).toUpperCase();
}

function setupPayNowButton() {
  const btn = document.getElementById("payNowBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // UI only: no real payment gateway. Just hand off a dummy booking ID.
    sessionStorage.setItem("bms_booking_id", generateBookingId());
    window.location.href = "booking-confirmation.html";
  });
}

function setupPaymentPage() {
  if (!document.getElementById("paymentMethods")) return;
  setupPaymentMethodSelection();
  renderPayAmount();
  setupPayNowButton();
}

/* ==========================================================================
   Booking Confirmation page
   ========================================================================== */

/** Fills in the booking ID and seat list left over from the earlier steps. */
function renderConfirmationDetails() {
  const idLabel = document.getElementById("bookingIdLabel");
  if (!idLabel) return;

  idLabel.textContent = sessionStorage.getItem("bms_booking_id") || generateBookingId();

  let seats = [];
  try {
    seats = JSON.parse(sessionStorage.getItem("bms_selected_seats")) || [];
  } catch {
    seats = [];
  }

  const seatsLabel = document.getElementById("confirmationSeats");
  if (seatsLabel) {
    seatsLabel.textContent = seats.length ? seats.map((s) => s.id).join(", ") : "—";
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

function setupConfirmationPage() {
  if (!document.getElementById("bookingIdLabel")) return;
  renderConfirmationDetails();
  setupCopyBookingId();
}

document.addEventListener("DOMContentLoaded", () => {
  renderSeatLayout();
  setupProceedButton();
  updateBookingBar();

  setupBookingSummaryPage();

  setupPaymentPage();

  setupConfirmationPage();
});
