import React from 'react';
import clsx from 'clsx';
import './SeatMap.css';

const SeatMap = ({ seats, selectedSeats, onToggle }) => {
  if (!Array.isArray(seats) || seats.length === 0) {
    return <div className="error-message">Không có dữ liệu ghế để hiển thị!</div>;
  }

  // Nhóm ghế theo hàng
  const grouped = seats.reduce((acc, seat) => {
    const row = seat.seat_number?.[0];
    if (!row || typeof row !== 'string') {
      console.warn('Dữ liệu ghế không hợp lệ:', seat);
      return acc;
    }
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {});

  // Sắp xếp số ghế trong từng hàng theo số
  Object.keys(grouped).forEach(row => {
    grouped[row].sort(
      (a, b) => parseInt(a.seat_number.slice(1)) - parseInt(b.seat_number.slice(1))
    );
  });

  // Sắp xếp hàng theo alphabet giảm dần: F → A
  const sortedRows = Object.keys(grouped).sort().reverse();

  return (
    <div className="seat-map">
      {sortedRows.map(row => (
        <div key={row} className="seat-row">
          <span className="seat-row-label">{row}</span>
          {grouped[row].map(seat => {
            const isHeld = seat.isHeld || false;
            const isBooked = seat.isBooked || false;
            const isSelected = selectedSeats.includes(seat.id);
            const isVip = seat.seat_type === 'vip';

            return (
              <button
                key={seat.id}
                onClick={() => !isHeld && !isBooked && onToggle(seat)}
                disabled={isHeld || isBooked}
                className={clsx('seat-button', {
                  held: isHeld,
                  booked: isBooked,
                  selected: isSelected,
                  vip: !isHeld && !isBooked && !isSelected && isVip, // màu xanh lá cây mặc định
                })}
              >
                {seat.seat_number}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default SeatMap;
