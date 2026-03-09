import React, { useState } from 'react';
import clsx from 'clsx';
import { Modal, Descriptions, message } from 'antd';
import axios from 'axios';
import './SeatMapAdmin.css';

const SeatMapAdmin = ({ seats, selectedSeats, onToggle, showTimeId }) => {
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBookingDetails = async (seatId) => {
    try {
      setLoading(true);
      console.log('Gọi API chi tiết booking:', { showTimeId, seatId });
      
      const response = await axios.get(`http://localhost:5001/api/admin/showtimes/seat-details`, {
        params: { showTimeId, seatId },
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      
      setBookingDetails(response.data);
      setBookingModalVisible(true);
    } catch (error) {
      console.error('Lỗi lấy chi tiết booking:', error.response?.data || error.message);
      message.error('Không thể tải chi tiết booking');
    } finally {
      setLoading(false);
    }
  };

  if (!Array.isArray(seats) || seats.length === 0) {
    return <div className="error-message">Không có dữ liệu ghế để hiển thị!</div>;
  }

  // Nhóm ghế theo hàng - parse seat_number như "A1", "B5", "C12"
  const grouped = seats.reduce((acc, seat) => {
    const seatNumber = seat.seat_number;
    
    if (!seatNumber || typeof seatNumber !== 'string') {
      console.warn('Dữ liệu ghế không hợp lệ:', seat);
      return acc;
    }
    
    // Parse seat_number: "A1" -> row="A", column=1
    // Hoặc "A10" -> row="A", column=10
    const match = seatNumber.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      console.warn('Format ghế không hợp lệ:', seatNumber);
      return acc;
    }
    
    const row = match[1]; // "A", "B", "C"
    const column = parseInt(match[2]); // 1, 2, 10
    
    if (!acc[row]) acc[row] = [];
    acc[row].push({
      ...seat,
      seat_row: row,
      seat_column: column,
      display_number: seatNumber // Giữ nguyên để hiển thị
    });
    
    return acc;
  }, {});

  // Sắp xếp số ghế trong từng hàng theo seat_column
  Object.keys(grouped).forEach(row => {
    grouped[row].sort((a, b) => a.seat_column - b.seat_column);
  });

  // Sắp xếp hàng theo alphabet giảm dần: F → A
  const sortedRows = Object.keys(grouped).sort().reverse();

  return (
    <div className="seat-map">
      <div className="seat-map-header">
        <div className="screen">MÀN HÌNH</div>
      </div>
      
      <div className="seat-grid">
        {sortedRows.map(row => (
          <div key={row} className="seat-row">
            <span className="seat-row-label">{row}</span>
            <div className="seat-row-content">
              {grouped[row].map(seat => {
                const isAvailable = seat.is_available;
                const seatNumber = seat.display_number;
                const isVip = seat.seat_type === 'vip';

                return (
                  <button
                    key={seat.id}
                    className={clsx('seat-button', {
                      'seat-booked': !isAvailable,
                      'seat-empty': isAvailable,
                      'seat-vip': isVip,
                      'seat-standard': !isVip
                    })}
                    onClick={() => fetchBookingDetails(seat.id)}
                    disabled={loading}
                    title={
                      isAvailable 
                        ? `Ghế ${seatNumber} (${isVip ? 'VIP' : 'Thường'}): Trống` 
                        : `Ghế ${seatNumber} (${isVip ? 'VIP' : 'Thường'}): Đã đặt`
                    }
                  >
                    {seatNumber}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      
      <div className="seat-legend">
        <div className="legend-item">
          <div className="legend-color seat-empty seat-standard"></div>
          <span>Ghế thường - Trống</span>
        </div>
        <div className="legend-item">
          <div className="legend-color seat-empty seat-vip"></div>
          <span>Ghế VIP - Trống</span>
        </div>
        <div className="legend-item">
          <div className="legend-color seat-booked"></div>
          <span>Đã đặt</span>
        </div>
      </div>

      <Modal
        title="Chi tiết booking"
        open={bookingModalVisible}
        onCancel={() => {
          setBookingModalVisible(false);
          setBookingDetails(null);
        }}
        footer={null}
        width={500}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            Đang tải...
          </div>
        ) : (bookingDetails?.message || bookingDetails?.isEmpty) ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>
            {bookingDetails.message || 'Ghế chưa được đặt'}
          </p>
        ) : bookingDetails ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Thông tin người dùng">
              <div>
                <strong>Tên đăng nhập:</strong> {bookingDetails.username || 'Không có'}<br/>
                <strong>Email:</strong> {bookingDetails.email || 'Không có'}<br/>
                <strong>SĐT:</strong> {bookingDetails.phone || 'Không có'}<br/>
                <strong>Giới tính:</strong> {bookingDetails.gender || 'Không xác định'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="User ID">
              {bookingDetails.user_id}
            </Descriptions.Item>
            <Descriptions.Item label="Booking ID">
              {bookingDetails.booking_id}
            </Descriptions.Item>
            <Descriptions.Item label="Vị trí ghế">
              {bookingDetails.seat_number}
            </Descriptions.Item>
            <Descriptions.Item label="Loại ghế">
              <span style={{
                color: bookingDetails.seat_type === 'vip' ? '#d4af37' : '#666',
                fontWeight: 'bold'
              }}>
                {bookingDetails.seat_type === 'vip' ? 'VIP' : 'Thường'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <span style={{
                color: bookingDetails.status === 'confirmed' ? '#52c41a' : '#faad14',
                fontWeight: 'bold'
              }}>
                {bookingDetails.status === 'confirmed' ? 'Đã xác nhận' : 
                 bookingDetails.status === 'held' ? 'Đang giữ chỗ' : 
                 'Không xác định'}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức thanh toán">
              {bookingDetails.payment_method === 'credit_card' ? 'Thẻ tín dụng' :
               bookingDetails.payment_method === 'bank' ? 'Chuyển khoản' :
               bookingDetails.payment_method === 'cash' ? 'Tiền mặt' :
               bookingDetails.payment_method === 'counter' ? 'Tại quầy' :
               'Chưa thanh toán'}
            </Descriptions.Item>
            <Descriptions.Item label="Tổng tiền">
              {bookingDetails.total_price ? 
                `${bookingDetails.total_price.toLocaleString('vi-VN')} VND` : 
                'Chưa có'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đặt">
              {bookingDetails.created_at ? 
                new Date(bookingDetails.created_at).toLocaleString('vi-VN') : 
                'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian hết hạn">
              {bookingDetails.expire_at ? 
                new Date(bookingDetails.expire_at).toLocaleString('vi-VN') : 
                'Không có hạn'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </div>
  );
};

export default SeatMapAdmin;