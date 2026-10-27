import { createRoot } from 'react-dom/client';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import BookingHistoryPage from './BookingHistoryPage';
import { requireLogin } from '../lib/toolkit';

// The one place React Router is used. HashRouter keeps the route after the "#"
// (booking-history.html#/history/upcoming), so it works on plain static hosting
// like Live Server, and refreshing the page never causes a 404.
function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/history/:status" element={<BookingHistoryPage />} />
        {/* Anything else, including no hash at all, goes to the "All" tab. */}
        <Route path="*" element={<Navigate to="/history/all" replace />} />
      </Routes>
    </HashRouter>
  );
}

// Booking history belongs to a logged-in user; otherwise go to login and come back here.
if (requireLogin()) {
  createRoot(document.getElementById('root')).render(<App />);
}
