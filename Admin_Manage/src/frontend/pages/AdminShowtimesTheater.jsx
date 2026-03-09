import React, { useEffect, useState, useCallback } from 'react';
import { Card, Spin, Typography, Divider, Row, Col, Modal, message, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import SeatMapAdmin from '../components/SeatMapAdmin';

const { Title, Text } = Typography;

const AdminShowtimesTheater = () => {
  const [theater, setTheater] = useState(null);
  const [showtimesData, setShowtimesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  useEffect(() => {
    fetchTheaterAndShowtimes();
  }, []);

  // Auto refresh khi tab được focus lại
  useEffect(() => {
    const handleFocus = () => {
      console.log('Tab focused, refreshing data...');
      fetchTheaterAndShowtimes();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Tab visible, refreshing data...');
        fetchTheaterAndShowtimes();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchTheaterAndShowtimes = useCallback(async () => {
    setLoading(true);
    try {
      const resTheater = await axios.get('http://localhost:5001/api/admin/theater/assigned', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      
      if (!resTheater.data || !resTheater.data.id) {
        throw new Error('Dữ liệu rạp không hợp lệ hoặc không tồn tại');
      }
      setTheater(resTheater.data);

      const resSchedule = await axios.get(
        `http://localhost:5001/api/admin/showtimes/theater/${resTheater.data.id}/showtimes`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` } }
      );
      
      const data = Array.isArray(resSchedule.data) ? resSchedule.data : [];
      const processedData = data.map(room => {
        const showtimes = {};
        Object.entries(room.showtimes || {}).forEach(([date, times]) => {
          showtimes[date] = times.map(t => {
            const parts = t.split('|');
            
            if (parts.length !== 4) {
              console.log('Format không đúng, expect 4 parts:', parts);
              return null;
            }
            
            return {
              show_time_id: parseInt(parts[0]),
              show_time: parts[1] || 'N/A',
              movie_title: parts[2] || 'Không có tiêu đề',
              available_seats: parseInt(parts[3]) || 0,
              capacity: room.capacity
            };
          }).filter(item => item !== null);
        });
        return { ...room, showtimes };
      });
      
      setShowtimesData(processedData);
      
    } catch (error) {
      console.error('Lỗi lấy dữ liệu rạp hoặc lịch chiếu:', error);
      message.error('Không thể tải dữ liệu rạp hoặc lịch chiếu');
      setShowtimesData([]);
    }
    setLoading(false);
  }, []);

  const handleShowtimeClick = useCallback(async (showTimeId, roomCapacity) => {
    if (!showTimeId || isNaN(showTimeId)) {
      message.error('ID suất chiếu không hợp lệ');
      return;
    }
    
    setModalLoading(true);
    try {
      const response = await axios.get(`http://localhost:5001/api/admin/showtimes/${showTimeId}/seats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      
      setSelectedShowtime({
        show_time_id: showTimeId,
        seats: response.data.seats,
        totalSeats: response.data.total_seats,
        availableSeats: response.data.available_seats
      });
      setModalVisible(true);
    } catch (error) {
      console.error('Lỗi tải chi tiết ghế:', error);
      message.error(error.response?.data?.error || 'Không thể tải danh sách ghế cho suất chiếu này');
    } finally {
      setModalLoading(false);
    }
  }, [theater?.id]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchTheaterAndShowtimes();
  };

  return (
    <div style={{ padding: '32px 48px', backgroundColor: '#f0f2f5', minHeight: '100vh', width: '100%', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <Title level={3} style={{ marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#1a1a1a' }}>
        🎬 Lịch chiếu - {theater?.name || 'Không xác định'}
      </Title>
      
      {theater && (
        <Text type="secondary" style={{ fontSize: 16, color: '#595959', marginBottom: '20px' }}>
          📍 {theater.address} | ☎️ {theater.hotline} | 🏙️ Tỉnh: {theater.province_name || 'Không xác định'} | 🛋️ Số phòng: {theater.total_rooms}
        </Text>
      )}
      
      <Divider style={{ margin: '20px 0' }} />
      
      {loading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : showtimesData.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 16, color: '#595959', textAlign: 'center', padding: '20px' }}>
          Không có lịch chiếu nào hoặc rạp không tồn tại.
        </Text>
      ) : (
        <Row gutter={[24, 24]} style={{ width: '100%', flexWrap: 'wrap', justifyContent: 'flex-start', margin: 0 }}>
          {showtimesData.map(room => (
            <Col key={room.room_id} xs={24} sm={24} md={12} lg={8} xl={6} style={{ display: 'flex', marginBottom: '24px', maxWidth: '100%' }}>
              <Card 
                title={<span style={{ fontWeight: 'bold', color: '#1a1a1a' }}>Phòng chiếu {room.room_number}</span>} 
                style={{ borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', backgroundColor: '#fff', width: '100%', minHeight: 300, overflow: 'hidden' }}
              >
                {Object.keys(room.showtimes).map(date => (
                  <div key={date} style={{ marginBottom: 16, padding: '0 12px' }}>
                    <Text strong style={{ color: '#1677ff', fontSize: 15, display: 'block', marginBottom: '8px' }}>
                      📅 {moment(date).format('DD/MM/YYYY')}
                    </Text>
                    <ul style={{ marginTop: 0, paddingLeft: 20, maxHeight: '180px', overflowY: 'auto', listStyleType: 'disc' }}>
                      {room.showtimes[date].map((item, index) => (
                        <li
                          key={index}
                          onClick={() => handleShowtimeClick(item.show_time_id, item.capacity)}
                          style={{ 
                            marginBottom: 6, 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis', 
                            maxWidth: '100%', 
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s',
                            backgroundColor: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e6f7ff';
                            e.currentTarget.style.color = '#1890ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#333';
                          }}
                        >
                          <Text style={{ fontSize: 14, color: 'inherit' }}>
                            {item.show_time} - {item.movie_title} ({item.available_seats}/{item.capacity})
                          </Text>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Floating Refresh Button */}
      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<ReloadOutlined spin={loading} />}
        onClick={handleManualRefresh}
        loading={loading}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
          zIndex: 1000,
          fontSize: '18px'
        }}
        title="Làm mới dữ liệu"
      />

      {/* Seat Modal */}
      <Modal 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        width={800}
        title="Chi tiết ghế suất chiếu"
      >
        {modalLoading ? (
          <Spin size="large" style={{ display: 'block', margin: '50px auto' }} />
        ) : (
          <div className="seat-map-container">
          
            <SeatMapAdmin
              seats={selectedShowtime?.seats || []}
              selectedSeats={[]}
              onToggle={() => {}}
              showTimeId={selectedShowtime?.show_time_id}
            />
            {selectedShowtime && (
              <Text style={{ marginTop: 16, display: 'block' }}>
                📊 Tổng ghế: {selectedShowtime.totalSeats}, Ghế trống: {selectedShowtime.availableSeats} | 🔴 Đã đặt | ⚪ Trống
              </Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminShowtimesTheater;