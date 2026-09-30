// Single source of truth for booking price math (CLAUDE.md section 7).
// GST applies to the convenience fee only, not the ticket subtotal.
const CONVENIENCE_FEE_PER_TICKET = 30;
const GST_RATE = 0.18;
const MIN_SEATS_PER_BOOKING = 1;
const MAX_SEATS_PER_BOOKING = 10;

function computePricing(ticketTotal, ticketCount) {
  const convenienceFee = ticketCount * CONVENIENCE_FEE_PER_TICKET;
  const gst = Math.round(convenienceFee * GST_RATE);
  const grandTotal = ticketTotal + convenienceFee + gst;
  return { ticketTotal, convenienceFee, gst, grandTotal };
}

module.exports = {
  CONVENIENCE_FEE_PER_TICKET,
  GST_RATE,
  MIN_SEATS_PER_BOOKING,
  MAX_SEATS_PER_BOOKING,
  computePricing,
};
