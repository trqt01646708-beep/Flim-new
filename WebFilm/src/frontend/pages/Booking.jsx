import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import SeatMap from '../components/seatMap';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { io } from 'socket.io-client';
import { notification } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import './booking.css';

// Tạo axios instance với base config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để tự động thêm token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor để handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      sessionStorage.clear();
      notification.error({
        message: 'Phiên đăng nhập hết hạn',
        description: 'Vui lòng đăng nhập lại',
      });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const Booking = () => {
  const { showTimeId } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { movie, showtime } = state || {};
  
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingId, setBookingId] = useState(null);
  const [countdown, setCountdown] = useState(300);
  const [step, setStep] = useState('select');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [ticketPrices, setTicketPrices] = useState({});
  const [userPoints, setUserPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [loading, setLoading] = useState(false);
  
  const socket = useRef(null);
  const isSubmitting = useRef(false);

  // Helper function để xóa pending booking
  const clearPendingBooking = () => {
    sessionStorage.removeItem('pendingBooking');
  };

  // Load booking state từ storage khi mount
  useEffect(() => {
    const savedBooking = sessionStorage.getItem('pendingBooking');
    if (savedBooking) {
      try {
        const { bookingId: savedBookingId, countdown: savedCountdown, step: savedStep, expires, savedShowTimeId } = JSON.parse(savedBooking);
        
        // Kiểm tra cùng showtime và còn hạn
        if (savedShowTimeId === showTimeId && expires > Date.now()) {
          setBookingId(savedBookingId);
          setCountdown(Math.floor((expires - Date.now()) / 1000));
          setStep(savedStep);
          console.log('Restored booking from storage:', savedBookingId);
        } else {
          clearPendingBooking();
        }
      } catch (err) {
        console.error('Error restoring booking:', err);
        clearPendingBooking();
      }
    }
  }, [showTimeId]);

  // Lưu booking state khi thay đổi
  useEffect(() => {
    if (bookingId && countdown > 0) {
      const expires = Date.now() + (countdown * 1000);
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        bookingId,
        countdown,
        step,
        expires,
        savedShowTimeId: showTimeId,
      }));
    }
  }, [bookingId, countdown, step, showTimeId]);

  // Redirect nếu không có movie/showtime info
  useEffect(() => {
    if (!movie || !showtime) {
      notification.error({
        message: 'Lỗi',
        description: 'Thông tin không hợp lệ. Vui lòng chọn lại suất chiếu.',
      });
      navigate('/');
    }
  }, [movie, showtime, navigate]);

  // Fetch seats and status
  const fetchSeatsAndStatus = useCallback(async () => {
    try {
      const [seatsResponse, statusResponse] = await Promise.all([
        api.get(`/bookings/seats?show_time_id=${showTimeId}`),
        api.get(`/bookings/status?show_time_id=${showTimeId}`).catch(() => ({ data: [] }))
      ]);

      const seatsData = seatsResponse.data;
      const statusData = statusResponse.data;

      const updatedSeats = seatsData.map(seat => {
        const seatStatus = statusData.find(s => s.seat_id === seat.id);
        return {
          ...seat,
          isHeld: !!(seatStatus?.booking_id && !seatStatus.is_confirmed),
          isBooked: !!(seatStatus?.booking_id && seatStatus.is_confirmed),
        };
      });
      
      setSeats(updatedSeats);
    } catch (err) {
      console.error('Lỗi load seats:', err);
      notification.error({
        message: 'Không thể tải thông tin ghế',
        description: 'Vui lòng tải lại trang',
      });
    }
  }, [showTimeId]);

  // Fetch user points
  const fetchUserPoints = useCallback(async () => {
    if (!token) return;

    try {
      const response = await api.get('/users/profile');
      setUserPoints(response.data.points || 0);
    } catch (err) {
      console.error('Lỗi lấy điểm user:', err);
    }
  }, [token]);

  // Fetch ticket prices
  const fetchTicketPrices = useCallback(async () => {
    try {
      const response = await api.get(`/bookings/ticket-prices?show_time_id=${showTimeId}`);
      setTicketPrices(response.data);
    } catch (err) {
      console.error('Lỗi lấy giá vé:', err);
    }
  }, [showTimeId]);

  // Setup Socket.IO
  useEffect(() => {
    let isSubscribed = true;

    const connectSocket = () => {
      socket.current = io('http://localhost:5000', {
        auth: { token: token || '' },
        transports: ['websocket', 'polling'],
        reconnection: true,
      });

      socket.current.on('connect', () => {
        if (isSubscribed) {
          console.log('Socket connected:', socket.current.id);
          socket.current.emit('joinRoom', showTimeId);
        }
      });

      socket.current.on('seatStatusUpdated', () => {
        if (isSubscribed) {
          fetchSeatsAndStatus();
        }
      });

      socket.current.on('connect_error', (err) => {
        console.warn('Socket error:', err.message);
      });
    };

    connectSocket();

    return () => {
      isSubscribed = false;
      if (socket.current) {
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [showTimeId, token, fetchSeatsAndStatus]);

  // Initial data fetch
  useEffect(() => {
    fetchSeatsAndStatus();
    fetchTicketPrices();
    fetchUserPoints();
  }, [fetchSeatsAndStatus, fetchTicketPrices, fetchUserPoints]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      isSubmitting.current = false;
      window.__bookingSubmitLock = false;
    };
  }, []);

  // Toggle seat selection
  const toggleSeat = (seat) => {
    if (seat.isHeld || seat.isBooked) return;
    
    setSelectedSeats(prev =>
      prev.includes(seat.id)
        ? prev.filter(id => id !== seat.id)
        : [...prev, seat.id]
    );
  };

  // Calculations
  const calculateTotal = () => {
    return selectedSeats.reduce((sum, seatId) => {
      const seatObj = seats.find(seat => seat.id === seatId);
      const seatType = seatObj?.seat_type || 'standard';
      const price = Number(ticketPrices[seatType]) || 0;
      return sum + price;
    }, 0);
  };

  const calculateDiscount = () => {
    if (!usePoints || pointsToUse <= 0) return 0;
    return Math.floor(pointsToUse / 1000) * 5000;
  };

  const calculateFinalPrice = () => {
    const total = calculateTotal();
    const discount = calculateDiscount();
    return Math.max(0, total - discount);
  };

  const calculatePointsEarned = () => {
    const finalPrice = calculateFinalPrice();
    return Math.floor(finalPrice / 80000) * 1500;
  };

  const handlePointsChange = (value) => {
    const points = parseInt(value) || 0;
    const maxPoints = Math.min(userPoints, Math.ceil(calculateTotal() / 5000) * 1000);
    setPointsToUse(Math.min(points, maxPoints));
  };

  // Hold seats
  const handleConfirmHold = async () => {
    if (!token) {
      notification.warning({
        message: 'Chưa đăng nhập',
        description: 'Bạn cần đăng nhập để đặt vé',
      });
      navigate('/login');
      return;
    }

    if (selectedSeats.length === 0) {
      notification.warning({
        message: 'Chưa chọn ghế',
        description: 'Vui lòng chọn ít nhất một ghế',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/bookings/hold', {
        show_time_id: Number(showTimeId),
        seat_ids: selectedSeats.map(id => Number(id)),
      });

      const { booking_id } = response.data;
      setBookingId(booking_id);
      setCountdown(300);
      setStep('payment');
      
      // Lưu vào storage
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        bookingId: booking_id,
        countdown: 300,
        step: 'payment',
        expires: Date.now() + (300 * 1000),
        savedShowTimeId: showTimeId,
      }));
      
      if (socket.current?.connected) {
        socket.current.emit('seatStatusUpdated');
      }

      notification.success({
        message: 'Giữ ghế thành công',
        description: 'Ghế đã được giữ trong 5 phút',
      });
    } catch (err) {
      console.error('Lỗi giữ ghế:', err);
      notification.error({
        message: 'Không thể giữ ghế',
        description: err.response?.data?.error || 'Vui lòng thử lại',
      });
    } finally {
      setLoading(false);
    }
  };

  // Confirm booking
  const handleConfirmBooking = async () => {
    if (isSubmitting.current || window.__bookingSubmitLock) {
      console.log('Request đang xử lý, bỏ qua');
      return;
    }

    if (!paymentMethod) {
      notification.warning({
        message: 'Chưa chọn phương thức thanh toán',
        description: 'Vui lòng chọn phương thức thanh toán',
      });
      return;
    }

    if (usePoints && pointsToUse > userPoints) {
      notification.error({
        message: 'Không đủ điểm',
        description: 'Số điểm sử dụng vượt quá số điểm hiện có',
      });
      return;
    }

    isSubmitting.current = true;
    window.__bookingSubmitLock = true;
    setLoading(true);

    try {
      const response = await api.post('/bookings/confirm', {
        booking_id: bookingId,
        payment_method: paymentMethod,
        use_points: usePoints ? pointsToUse : 0,
      });

      const { pointsUsed, discount, finalPrice, pointsEarned, newTotalPoints } = response.data;

      isSubmitting.current = false;
      window.__bookingSubmitLock = false;
      setLoading(false);

      if (socket.current?.connected) {
        socket.current.emit('confirmBooking', { 
          showTimeId, 
          bookingId 
        });
      }

      // Xóa pending booking
      clearPendingBooking();

      // Hiển thị notification ngắn gọn
      notification.success({
        message: 'Đặt vé thành công!',
        description: `Thanh toán: ${finalPrice.toLocaleString()}đ | Nhận ${pointsEarned} điểm`,
        duration: 2,
      });

      // Chuyển trang ngay lập tức
      navigate('/my-tickets');

    } catch (err) {
      isSubmitting.current = false;
      window.__bookingSubmitLock = false;
      
      console.error('Lỗi xác nhận booking:', err);

      let errorMessage = 'Đã có lỗi xảy ra';
      
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        
        if (errorData.error && errorData.error.includes('đã được xác nhận')) {
          notification.info({
            message: 'Booking đã được xử lý',
            description: 'Chuyển đến trang vé...',
            duration: 1
          });
          
          clearPendingBooking();
          
          setTimeout(() => {
            navigate('/my-tickets');
          }, 500);
          
          return;
        }
        
        errorMessage = errorData.error || 'Dữ liệu không hợp lệ';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
      }

      notification.error({
        message: 'Thanh toán thất bại',
        description: errorMessage,
        duration: 5
      });
    } finally {
      setLoading(false);
      isSubmitting.current = false;
      window.__bookingSubmitLock = false;
    }
  };

  // Cancel booking
  const handleCancelBooking = async () => {
    try {
      await api.post('/bookings/cancel', { booking_id: bookingId });
      
      notification.success({
        message: 'Hủy giữ ghế thành công',
      });
      
      setBookingId(null);
      setSelectedSeats([]);
      setStep('select');
      setCountdown(300);
      
      clearPendingBooking();
      
      if (socket.current?.connected) {
        socket.current.emit('seatStatusUpdated');
      }
    } catch (err) {
      console.error('Lỗi hủy:', err);
      notification.error({
        message: 'Lỗi hủy giữ ghế',
        description: err.response?.data?.error || 'Vui lòng thử lại',
      });
    }
  };

  // Countdown timer
  useEffect(() => {
    if (bookingId && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            clearPendingBooking();
            handleCancelBooking();
            notification.warning({
              message: 'Hết thời gian giữ ghế',
              description: 'Hệ thống đã tự động hủy. Vui lòng chọn lại ghế.',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [bookingId, countdown]);

  if (!movie || !showtime) {
    return null;
  }

  return (
    <div className="booking-container">
      <div className="progress-bar">
        <div className="step active">1. Chọn ghế</div>
        <div className="step-connector"></div>
        <div className={`step ${step === 'payment' ? 'active' : ''}`}>2. Thanh toán</div>
      </div>

      <div className="main-content">
        <div className="seat-section">
          <h1 className="movie-title">{movie.title}</h1>
          <p className="showtime-info">
            Suất chiếu: {dayjs(showtime.show_time).format('HH:mm')} - Phòng {showtime.room_number}
          </p>

          <div className="legend">
            <div><span className="legend-dot available"></span> Thường</div>
            <div><span className="legend-dot type"></span> Ghế vip</div>
            <div><span className="legend-dot selected"></span> Ghế đang chọn</div>
            <div><span className="legend-dot held"></span> Ghế được giữ</div>
            <div><span className="legend-dot booked"></span> Ghế đã bán</div>
          </div>

          <div className="seat-map-container">
            <div className="screen">MÀN HÌNH</div>
            <SeatMap seats={seats} selectedSeats={selectedSeats} onToggle={toggleSeat} />
          </div>

          <div className="action-buttons">
            {selectedSeats.length > 0 && !bookingId && (
              <>
                <p className="countdown-warning">Ghế sẽ được giữ trong 5 phút sau khi xác nhận!</p>
                <button 
                  className="confirm-button" 
                  onClick={handleConfirmHold}
                  disabled={loading || isSubmitting.current}
                >
                  {loading ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
                </button>
              </>
            )}
          
            {bookingId && step === 'select' && (
              <button 
                className="next-button" 
                onClick={() => setStep('payment')}
                disabled={loading || isSubmitting.current}
              >
                Tiếp tục thanh toán
              </button>
            )}

            {bookingId && (
              <>
                <p className="countdown-timer">
                  Còn lại: {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} phút
                </p>
                <button 
                  className="cancel-button" 
                  onClick={handleCancelBooking}
                  disabled={loading || isSubmitting.current}
                >
                  Hủy giữ ghế
                </button>
              </>
            )}
          </div>
        </div>

        <div className="movie-info">
          <img src={movie.poster} alt={movie.title} className="movie-poster" />
          <h2 className="info-title">{movie.title}</h2>
          
          <p className="info-detail"><strong>Thể loại:</strong> {movie.genre}</p>
          <p className="info-detail"><strong>Thời lượng:</strong> {movie.duration} phút</p>
          <p className="info-detail"><strong>Rạp:</strong> {showtime.theater_name}</p>
          <p className="info-detail"><strong>Ngày:</strong> {dayjs(showtime.show_time).format('DD/MM/YYYY')}</p>
          <p className="info-detail"><strong>Giờ:</strong> {dayjs(showtime.show_time).format('HH:mm')}</p>
          <p className="info-detail"><strong>Phòng:</strong> {showtime.room_number}</p>
          <p className="info-detail"><strong>Ghế:</strong>{' '}
            {selectedSeats.length > 0
              ? selectedSeats
                  .map(id => seats.find(s => s.id === id)?.seat_number || id)
                  .join(', ')
              : 'Chưa chọn'}
          </p>

          <div style={{ marginTop: '20px', borderTop: '2px solid #eee', paddingTop: '15px' }}>
            <p className="info-detail" style={{ fontWeight: 'bold', fontSize: '16px' }}>
              Tổng tiền: {calculateTotal().toLocaleString()}đ
            </p>

            {bookingId && step === 'payment' && token && (
              <div style={{ marginTop: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                  Điểm tích lũy hiện có: {userPoints.toLocaleString()} điểm
                </p>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => {
                        setUsePoints(e.target.checked);
                        if (!e.target.checked) setPointsToUse(0);
                      }}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                      disabled={loading || isSubmitting.current}
                    />
                    <span>Sử dụng điểm tích lũy</span>
                  </label>
                </div>

                {usePoints && (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <input
                        type="number"
                        value={pointsToUse}
                        onChange={(e) => handlePointsChange(e.target.value)}
                        placeholder="Nhập số điểm muốn dùng"
                        min="0"
                        max={Math.min(userPoints, Math.ceil(calculateTotal() / 5000) * 1000)}
                        step="1000"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        disabled={loading || isSubmitting.current}
                      />
                    </div>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      1,000 điểm = 5,000đ giảm giá
                    </p>
                    {pointsToUse > 0 && (
                      <p style={{ fontSize: '14px', color: '#28a745', fontWeight: 'bold' }}>
                        Giảm: {calculateDiscount().toLocaleString()}đ
                      </p>
                    )}
                  </div>
                )}

                {calculateDiscount() > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #ddd' }}>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#dc3545' }}>
                      Thanh toán: {calculateFinalPrice().toLocaleString()}đ
                    </p>
                    <p style={{ fontSize: '13px', color: '#28a745', marginTop: '5px' }}>
                      Bạn sẽ nhận: {calculatePointsEarned().toLocaleString()} điểm
                    </p>
                  </div>
                )}

                {!usePoints && calculatePointsEarned() > 0 && (
                  <p style={{ fontSize: '13px', color: '#28a745', marginTop: '10px' }}>
                    Giao dịch này sẽ tích: {calculatePointsEarned().toLocaleString()} điểm
                  </p>
                )}
              </div>
            )}
          </div>

          {bookingId && step === 'payment' && (
            <>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="payment-select"
                style={{ marginTop: '15px' }}
                disabled={loading || isSubmitting.current}
              >
                <option value="">Chọn phương thức thanh toán</option>
                <option value="credit_card">Thẻ tín dụng</option>
                <option value="bank">Chuyển khoản</option>
                <option value="cash">Thanh toán tại quầy</option>
              </select>
              <button 
                className="pay-button" 
                onClick={handleConfirmBooking}
                style={{ 
                  marginTop: '10px',
                  opacity: (loading || isSubmitting.current) ? 0.5 : 1,
                  cursor: (loading || isSubmitting.current) ? 'not-allowed' : 'pointer',
                  pointerEvents: (loading || isSubmitting.current) ? 'none' : 'auto'
                }}
                disabled={loading || isSubmitting.current}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;