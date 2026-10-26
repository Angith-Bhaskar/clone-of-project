import { memo } from 'react';

// One seat button. memo() means a seat only re-renders when ITS props change,
// so clicking one seat doesn't redraw the other 85.
function Seat({ seat, row, category, price, selected, onToggle }) {
  const booked = seat.status === 'booked';
  const className = `seat${booked ? ' booked' : ''}${selected ? ' selected' : ''}`;

  function handleClick() {
    onToggle({ id: seat.id, label: `${row}${seat.number}`, category, price });
  }

  return (
    <button type="button" className={className} disabled={booked} onClick={handleClick}>
      {seat.number}
    </button>
  );
}

export default memo(Seat);
