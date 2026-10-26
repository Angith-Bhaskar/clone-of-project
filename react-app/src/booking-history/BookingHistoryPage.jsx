import { useState } from 'react';
import BookingCard from './BookingCard';
import { apiGet } from '../lib/toolkit';
import { useLoader } from '../lib/hooks';

const FILTERS = [
  { status: 'all', label: 'All' },
  { status: 'upcoming', label: 'Upcoming' },
  { status: 'completed', label: 'Completed' },
  { status: 'cancelled', label: 'Cancelled' },
];

export default function BookingHistoryPage() {
  const [status, setStatus] = useState('all');

  // Changing the status re-runs the request: the server does the filtering.
  const { status: loadState, data: bookings } = useLoader(
    () => apiGet(status === 'all' ? '/bookings' : `/bookings?status=${encodeURIComponent(status)}`),
    [status]
  );

  let list;
  if (loadState === 'error') {
    list = <p className="list-message">Couldn&apos;t load your bookings. Please try again.</p>;
  } else if (!bookings) {
    list = <p className="list-message">Loading your bookings&hellip;</p>;
  } else {
    list = bookings.map((booking) => <BookingCard key={booking.id} booking={booking} />);
  }

  return (
    <main className="container profile-page">
      {/* Side nav shared with profile.html */}
      <aside className="profile-nav">
        <a href="profile.html" className="profile-nav-link">My Profile</a>
        <a href="booking-history.html" className="profile-nav-link active">Booking History</a>
      </aside>

      <section className="history-section">
        <div className="history-header">
          <h1>Booking History</h1>

          <div className="history-filters" id="historyFilters">
            {FILTERS.map((f) => (
              <button
                key={f.status}
                type="button"
                className={`history-filter-btn${status === f.status ? ' active' : ''}`}
                onClick={() => setStatus(f.status)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="booking-list" id="bookingList">{list}</div>

        {loadState === 'ready' && bookings.length === 0 && (
          <div className="empty-state" id="historyEmptyState">
            <img src="https://via.placeholder.com/160x160.png?text=No+Bookings" alt="No bookings" />
            <h3>No bookings here</h3>
            <p>You don&apos;t have any bookings in this category yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
