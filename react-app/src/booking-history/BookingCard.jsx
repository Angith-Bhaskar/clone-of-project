import { formatDate, formatRupees } from '../lib/toolkit';

// One row of the history list; clicking it opens that booking's confirmation page.
export default function BookingCard({ booking }) {
  const dateTime = [formatDate(booking.showDate), booking.showTime].filter(Boolean).join(', ');
  const seats = `${booking.seatCount} seat${booking.seatCount === 1 ? '' : 's'}`;

  return (
    <a className="booking-item" href={`booking-confirmation.html?bookingId=${encodeURIComponent(booking.id)}`}>
      <img
        className="booking-item-poster"
        src={booking.movie?.poster || ''}
        alt={`${booking.movie?.title || ''} poster`}
      />
      <div className="booking-item-info">
        <div className="booking-item-title-row">
          <span className="booking-item-title">{booking.movie?.title || ''}</span>
          <span className={`status-badge ${booking.status}`}>{booking.status}</span>
        </div>
        <p className="booking-item-meta">{booking.theatre?.name || ''}</p>
        <p className="booking-item-meta">
          {dateTime} &bull; {seats} &bull; {formatRupees(booking.amount)}
        </p>
      </div>
    </a>
  );
}
