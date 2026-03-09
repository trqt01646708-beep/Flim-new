import React, { useEffect, useState } from 'react';
import { Select, Card, Spin, Typography, Row, Col, Modal, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';
import SeatMapAdmin from '../components/SeatMapAdmin';

const { Option } = Select;
const { Title, Text } = Typography;

const AdminShowtimesSuper = () => {
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedTheaterName, setSelectedTheaterName] = useState('');
  const [showtimesData, setShowtimesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedShowtime, setSelectedShowtime] = useState(null);

  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    try {
      // Sử dụng route đúng từ adminTheaterRouter
      const res = await axios.get('http://localhost:5001/api/admin/theater/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      
      console.log('Theaters response:', res.data);
      
      // Đảm bảo theaters là array
      if (Array.isArray(res.data)) {
        setTheaters(res.data);
      } else {
        console.error('Theaters data is not array:', res.data);
        setTheaters([]);
      }
    } catch (error) {
      console.error('Lỗi lấy danh sách rạp:', error);
      message.error('Không thể tải danh sách rạp');
      setTheaters([]);
    }
  };

  const fetchShowtimes = async (theaterId) => {
    setLoading(true);
    try {
      // Sử dụng route từ showtimesController
      const res = await axios.get(`http://localhost:5001/api/admin/showtimes/theater/${theaterId}/showtimes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
      });
      
      console.log('Showtimes response:', res.data);
      
      const data = Array.isArray(res.data) ? res.data : [];
      const processedData = data.map(room => {
        const showtimes = {};
        Object.entries(room.showtimes || {}).forEach(([date, times]) => {
          showtimes[date] = times.map(t => {
            const parts = t.split('|');
            
            if (parts.length !== 4) {
              return `${t} (Format không đúng)`;
            }
            
            const showTimeId = parseInt(parts[0]);
            const showTime = parts[1];
            const movieTitle = parts[2];
            const availableSeats = parseInt(parts[3]);
            
            return {
              display: `${showTime} - ${movieTitle} (${availableSeats}/${room.capacity})`,
              show_time_id: showTimeId,
              show_time: showTime,
              movie_title: movieTitle,
              available_seats: availableSeats,
              capacity: room.capacity
            };
          });
        });
        return { ...room, showtimes };
      });
      
      setShowtimesData(processedData);
    } catch (error) {
      console.error('Lỗi lấy lịch chiếu:', error);
      message.error('Không thể tải lịch chiếu');
      setShowtimesData([]);
    }
    setLoading(false);
  };

  const handleSelectTheater = (theaterId) => {
    const theater = theaters.find(t => t.id === theaterId);
    setSelectedTheater(theaterId);
    setSelectedTheaterName(theater?.name || '');
    fetchShowtimes(theaterId);
  };

  const handleShowtimeClick = async (showtimeData) => {
  console.log('showtimeData:', showtimeData); // Thêm log để debug
  if (!showtimeData?.show_time_id || isNaN(showtimeData.show_time_id)) {
    message.error('ID suất chiếu không hợp lệ');
    return;
  }
  
  setModalLoading(true);
  try {
    const response = await axios.get(`http://localhost:5001/api/admin/showtimes/${showtimeData.show_time_id}/seats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('admin_token')}` },
    });
    
    setSelectedShowtime({
      show_time_id: showtimeData.show_time_id,
      movie_title: showtimeData.movie_title,
      show_time: showtimeData.show_time,
      seats: response.data.seats,
      totalSeats: response.data.total_seats,
      availableSeats: response.data.available_seats,
    });
    setModalVisible(true);
  } catch (error) {
    console.error('Lỗi tải chi tiết ghế:', error);
    message.error(error.response?.data?.error || 'Không thể tải danh sách ghế cho suất chiếu này');
  } finally {
    setModalLoading(false);
  }
};

  const handleRefresh = () => {
    if (selectedTheater) {
      fetchShowtimes(selectedTheater);
    }
  };

  return (
    <div style={{ padding: '32px 48px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          🎬 Lịch chiếu theo rạp {selectedTheaterName ? `- ${selectedTheaterName}` : ''}
        </Title>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Select
            style={{ width: 300 }}
            placeholder="Chọn rạp để xem lịch chiếu"
            onChange={handleSelectTheater}
            value={selectedTheater}
          >
            {theaters.map(theater => (
              <Option key={theater.id} value={theater.id}>
                {theater.name} - {theater.address}
              </Option>
            ))}
          </Select>
          
          {selectedTheater && (
            <button 
              onClick={handleRefresh}
              disabled={loading}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #1890ff',
                backgroundColor: '#1890ff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ReloadOutlined spin={loading} />
              Làm mới
            </button>
          )}
        </div>
      </div>

      {!selectedTheater ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Vui lòng chọn rạp để xem lịch chiếu
          </Text>
        </div>
      ) : loading ? (
        <Spin size="large" style={{ display: 'block', margin: '80px auto' }} />
      ) : showtimesData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Không có lịch chiếu nào cho rạp này
          </Text>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {showtimesData.map(room => (
            <Col key={room.room_id} xs={24} sm={24} md={12} lg={8} xl={6}>
              <Card 
                title={<span style={{ fontWeight: 'bold' }}>Phòng chiếu {room.room_number}</span>}
                style={{ 
                  borderRadius: 10, 
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  minHeight: 300 
                }}
              >
                {Object.keys(room.showtimes).length === 0 ? (
                  <Text type="secondary">Không có suất chiếu</Text>
                ) : (
                  Object.keys(room.showtimes).map(date => (
                    <div key={date} style={{ marginBottom: 16 }}>
                      <Text strong style={{ color: '#1677ff', fontSize: 15, display: 'block', marginBottom: '8px' }}>
                        📅 {moment(date).format('DD/MM/YYYY')}
                      </Text>
                      <ul style={{ marginTop: 0, paddingLeft: 20, maxHeight: '180px', overflowY: 'auto' }}>
                        {room.showtimes[date].map((item, index) => (
                          <li
                            key={index}
                            onClick={() => typeof item === 'object' ? handleShowtimeClick(item) : null}
                            style={{ 
                              marginBottom: 6,
                              cursor: typeof item === 'object' ? 'pointer' : 'default',
                              padding: '2px 4px',
                              borderRadius: '4px',
                              transition: 'background-color 0.3s'
                            }}
                            onMouseEnter={(e) => {
                              if (typeof item === 'object') {
                                e.target.style.backgroundColor = '#f0f0f0';
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Text style={{ fontSize: 14 }}>
                              {typeof item === 'object' ? item.display : item}
                            </Text>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Seat Modal */}
      <Modal 
        open={modalVisible} 
        onCancel={() => setModalVisible(false)} 
        footer={null} 
        width={800}
        title={selectedShowtime ? `${selectedShowtime.movie_title} - ${selectedShowtime.show_time}` : 'Chi tiết ghế'}
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

export default AdminShowtimesSuper;