import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from "../../contexts/AuthContext";
import { Spin, Empty, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

// Tạo axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor thêm token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

const MyTicket = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Hàm fetch tickets
  const fetchTickets = async () => {
    if (!token) {
      console.error('No token found');
      return;
    }

    setLoading(true);
    
    try {
      const response = await api.get('/bookings/my');
      console.log('Tickets data:', response.data);
      setTickets(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Lỗi lấy vé:', err.response?.data || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        sessionStorage.clear();
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch khi component mount
  useEffect(() => {
    fetchTickets();
  }, [token]);

  // Hàm lọc vé theo ngày
  const filterTicketsByDate = () => {
    if (!searchDate) return tickets;
    return tickets.filter(ticket => {
      const ticketDate = new Date(ticket.show_time).toLocaleDateString('vi-VN');
      return ticketDate === new Date(searchDate).toLocaleDateString('vi-VN');
    });
  };

  const styles = {
    container: {
      maxWidth: '1200px',
      width: '1600px',
      margin: '0 auto',
      padding: '5rem',
      backgroundColor: '#ffffffff',
      minHeight: '90vh',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      paddingTop: '12rem',
    },
    title: {
      color: '#1e293b',
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '1.5rem',
      borderBottom: '3px solid #e2e8f0',
      paddingBottom: '0.75rem',
      textAlign: 'center',
    },
    headerActions: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem',
    },
    searchContainer: {
      flex: 1,
    },
    searchInput: {
      padding: '0.75rem',
      width: '250px',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      fontSize: '1rem',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
      transition: 'border-color 0.3s ease',
    },
    ticketList: {
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 300px)',
      paddingBottom: '20px',
    },
    dateHeader: {
      color: '#1e40af',
      fontSize: '1.2rem',
      fontWeight: '600',
      marginTop: '2rem',
      marginBottom: '1rem',
      borderLeft: '5px solid #3b82f6',
      paddingLeft: '1rem',
    },
    noTicket: {
      color: '#64748b',
      fontStyle: 'italic',
      textAlign: 'center',
      padding: '1.5rem',
      backgroundColor: '#e5e7eb',
      borderRadius: '8px',
      marginTop: '2rem',
      fontSize: '1.1rem',
    },
    ticketCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '1.5rem',
      marginBottom: '2rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      maxWidth: '1000px',
      marginLeft: 'auto',
      marginRight: 'auto',
    },
    ticketCardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    },
    movieTitle: {
      color: '#1e40af',
      fontSize: '1.3rem',
      fontWeight: '700',
      marginBottom: '1rem',
    },
    detail: {
      margin: '0.75rem 0',
      color: '#374151',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'flex-start',
    },
    detailStrong: {
      color: '#1f2937',
      fontWeight: '600',
      minWidth: '150px',
    },
    status: {
      marginLeft: '0.75rem',
      fontWeight: '500',
    },
    statusConfirmed: {
      color: '#059669',
      backgroundColor: '#d1fae5',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
    },
    statusHeld: {
      color: '#d97706',
      backgroundColor: '#fef3c7',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
    },
    statusOther: {
      color: '#6b7280',
      backgroundColor: '#f3f4f6',
      padding: '0.25rem 0.5rem',
      borderRadius: '4px',
    },
  };

  const groupedTickets = {};
  filterTicketsByDate().forEach(ticket => {
    const date = new Date(ticket.show_time).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    if (!groupedTickets[date]) groupedTickets[date] = [];
    groupedTickets[date].push(ticket);
  });

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Vé của tôi</h2>

      <div style={styles.headerActions}>
        <div style={styles.searchContainer}>
          <input
            type="date"
            value={searchDate}
            onChange={e => setSearchDate(e.target.value)}
            style={styles.searchInput}
            placeholder="Chọn ngày"
          />
        </div>
        
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={fetchTickets}
          loading={loading}
        >
          Tải lại
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" tip="Đang tải vé..." />
        </div>
      ) : Object.keys(groupedTickets).length === 0 ? (
        <Empty
          description="Bạn chưa có vé nào"
          style={{ marginTop: '60px' }}
        />
      ) : (
        <div style={styles.ticketList}>
          {Object.keys(groupedTickets).map(date => (
            <div key={date}>
              <h3 style={styles.dateHeader}>{date}</h3>
              {groupedTickets[date].map(ticket => (
                <div
                  key={ticket.booking_id}
                  style={styles.ticketCard}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = styles.ticketCardHover.transform;
                    e.currentTarget.style.boxShadow = styles.ticketCardHover.boxShadow;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = styles.ticketCard.boxShadow;
                  }}
                >
                  <h3 style={styles.movieTitle}>{ticket.movie_title}</h3>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Rạp:</strong>{' '}
                    {ticket.theater_name} - {ticket.theater_address}
                  </p>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Suất chiếu:</strong>{' '}
                    {new Date(ticket.show_time).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Ghế:</strong> {ticket.seat_numbers}
                  </p>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Tổng tiền:</strong> {parseFloat(ticket.total_price || 0).toLocaleString()}đ
                  </p>
                  {ticket.points_used > 0 && (
                    <p style={styles.detail}>
                      <strong style={styles.detailStrong}>Điểm đã dùng:</strong> {ticket.points_used} điểm
                    </p>
                  )}
                  {ticket.discount_amount > 0 && (
                    <p style={styles.detail}>
                      <strong style={styles.detailStrong}>Giảm giá:</strong> {parseFloat(ticket.discount_amount || 0).toLocaleString()}đ
                    </p>
                  )}
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Trạng thái:</strong>{' '}
                    <span
                      style={{
                        ...styles.status,
                        ...(ticket.status === 'confirmed'
                          ? styles.statusConfirmed
                          : ticket.status === 'held'
                          ? styles.statusHeld
                          : styles.statusOther),
                      }}
                    >
                      {ticket.status === 'confirmed' ? 'Đã xác nhận' : ticket.status}
                    </span>
                  </p>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Hình thức:</strong> {ticket.payment_method}
                  </p>
                  <p style={styles.detail}>
                    <strong style={styles.detailStrong}>Thời gian đặt:</strong>{' '}
                    {new Date(ticket.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicket;