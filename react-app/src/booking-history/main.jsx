import { createRoot } from 'react-dom/client';
import BookingHistoryPage from './BookingHistoryPage';
import { requireLogin } from '../lib/toolkit';

// Booking history belongs to a logged-in user; otherwise go to login and come back here.
if (requireLogin()) {
  createRoot(document.getElementById('root')).render(<BookingHistoryPage />);
}
