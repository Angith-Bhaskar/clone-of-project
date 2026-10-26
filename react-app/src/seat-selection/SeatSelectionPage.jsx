import { useCallback, useMemo, useState } from 'react';
import SeatLayout from './SeatLayout';
import { apiGet, formatDate, formatRupees, getQueryParam, requireLogin } from '../lib/toolkit';
import { useLoader } from '../lib/hooks';

const MAX_SEATS_PER_BOOKING = 10; // display-only cap; the server enforces it for real

export default function SeatSelectionPage() {
  const showId = getQueryParam('showId');

  // Server data: the show header + the seat map. No showId in the URL -> nothing to load.
  const { status, data } = useLoader(
    () => {
      if (!showId) return Promise.resolve(null);
      const id = encodeURIComponent(showId);
      return Promise.all([apiGet(`/shows/${id}`), apiGet(`/shows/${id}/seats`)]).then(
        ([show, categories]) => ({ show, categories })
      );
    },
    [showId]
  );

  // The one piece of state the user changes: which seats are picked.
  // Everything else on screen (count, total, Proceed enabled) is derived from it.
  const [selected, setSelected] = useState([]); // [{ id, label, category, price }]

  const toggleSeat = useCallback((seat) => {
    setSelected((prev) => {
      if (prev.some((s) => s.id === seat.id)) return prev.filter((s) => s.id !== seat.id);
      if (prev.length >= MAX_SEATS_PER_BOOKING) return prev;
      return [...prev, seat];
    });
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);
  const total = selected.reduce((sum, s) => sum + s.price, 0);

  function handleProceed() {
    if (selected.length === 0) return;
    // Only ids travel to the next page; the server recomputes every price.
    sessionStorage.setItem('bookingDraft', JSON.stringify({ showId, seatIds: selected.map((s) => s.id) }));
    // Browsing seats is public, but booking needs an account. The draft survives the login detour.
    if (!requireLogin('booking-summary.html')) return;
    window.location.href = 'booking-summary.html';
  }

  const show = data?.show;
  const headerMeta = show
    ? [show.theatre?.name, [formatDate(show.showDate), show.showTime].filter(Boolean).join(', '), show.format]
        .filter(Boolean)
        .join(' • ')
    : '';

  let seatArea;
  if (!showId) {
    seatArea = <div className="seat-layout"><p className="list-message">No show selected. Please go back and pick a showtime.</p></div>;
  } else if (status === 'loading') {
    seatArea = <div className="seat-layout"><p className="list-message">Loading seats&hellip;</p></div>;
  } else if (status === 'error') {
    seatArea = <div className="seat-layout"><p className="list-message">Couldn&apos;t load seats. Please try again.</p></div>;
  } else {
    seatArea = <SeatLayout categories={data.categories} selectedIds={selectedIds} onToggle={toggleSeat} />;
  }

  return (
    <>
      <main className="container seat-page">
        <div className="seat-page-header">
          <h1 id="seatShowTitle">{show ? show.movie?.title : 'Loading…'}</h1>
          <p className="details-meta-line-dark" id="seatShowMeta">{headerMeta}</p>
        </div>

        {seatArea}

        {/* Screen indicator */}
        <div className="screen-wrap">
          <div className="screen"></div>
          <p className="screen-label">All eyes this way please!</p>
        </div>

        {/* Legend */}
        <div className="seat-legend">
          <span><i className="seat-swatch available"></i> Available</span>
          <span><i className="seat-swatch selected"></i> Selected</span>
          <span><i className="seat-swatch booked"></i> Booked</span>
        </div>
      </main>

      {/* Sticky summary bar */}
      <div className="booking-bar" id="bookingBar">
        <div className="booking-bar-info">
          <span id="seatCountLabel">
            {selected.length} Ticket{selected.length === 1 ? '' : 's'}
          </span>
          <strong id="seatTotalLabel">{formatRupees(total)}</strong>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          id="proceedBtn"
          disabled={selected.length === 0}
          onClick={handleProceed}
        >
          Proceed to Pay
        </button>
      </div>
    </>
  );
}
