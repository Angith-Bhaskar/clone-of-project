import Seat from './Seat';
import { formatRupees } from '../lib/toolkit';

function SeatRow({ row, category, price, selectedIds, onToggle }) {
  return (
    <div className="seat-row">
      <span className="seat-row-label">{row.row}</span>
      <div className="seat-row-seats">
        {row.seats.map((seat) => (
          <Seat
            key={seat.id}
            seat={seat}
            row={row.row}
            category={category}
            price={price}
            selected={selectedIds.has(seat.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function SeatCategory({ category, selectedIds, onToggle }) {
  return (
    <div className="seat-category">
      <div className="seat-category-label">{category.category}</div>
      <div className="seat-category-price">{formatRupees(category.price)} per ticket</div>
      {category.rows.map((row) => (
        <SeatRow
          key={row.row}
          row={row}
          category={category.category}
          price={category.price}
          selectedIds={selectedIds}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

// Platinum -> Gold -> Silver, each with its rows of seats (order comes from the API).
export default function SeatLayout({ categories, selectedIds, onToggle }) {
  return (
    <div className="seat-layout" id="seatLayout">
      {categories.map((category) => (
        <SeatCategory key={category.category} category={category} selectedIds={selectedIds} onToggle={onToggle} />
      ))}
    </div>
  );
}
