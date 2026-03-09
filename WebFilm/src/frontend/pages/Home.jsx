import React, { useEffect, useState } from 'react';
import HeaderMenu from '../components/Header.jsx';
import { Layout, Row, Col, Card, Select, Button } from 'antd';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Carousel } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

const { Content } = Layout;
const { Option } = Select;

const Home = () => {
  const [ads, setAds] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [movies, setMovies] = useState([]);

  // Load banners
  useEffect(() => {
    axios.get('http://localhost:5000/api/adv')
      .then(res => setAds(res.data))
      .catch(err => console.error('Lỗi tải quảng cáo:', err));
  }, []);

  // Load danh sách rạp
  useEffect(() => {
    axios.get('http://localhost:5000/api/theaters')
      .then(res => setTheaters(res.data))
      .catch(err => console.error('Lỗi tải danh sách rạp:', err));
  }, []);

  // Tạo danh sách 7 ngày
  useEffect(() => {
    const dateRange = [];
    for (let i = 0; i < 7; i++) {
      dateRange.push(dayjs().add(i, 'day'));
    }
    setDates(dateRange);
    setSelectedDate(dayjs()); // Mặc định chọn hôm nay
  }, []);

  // Load phim khi chọn rạp và ngày
  useEffect(() => {
    if (!selectedTheater || !selectedDate) {
      setMovies([]);
      return;
    }

    // Lấy danh sách phim có suất chiếu trong khoảng 6 ngày
    axios.get(`http://localhost:5000/api/theaters/${selectedTheater}/upcoming-movies`)
      .then(res => {
        // Kiểm tra từng phim có suất chiếu vào ngày được chọn không
        Promise.all(res.data.map(movie =>
          axios.get(`http://localhost:5000/api/showtimes`, {
            params: {
              movie_id: movie.id,
              theater_id: selectedTheater,
              date: selectedDate.format('YYYY-MM-DD')
            }
          }).then(response => ({ 
            movie: movie,
            hasShowtime: response.data.length > 0 
          }))
        )).then(results => {
          // Chỉ lấy những phim có suất chiếu vào ngày đã chọn
          const moviesWithShowtime = results
            .filter(item => item.hasShowtime)
            .map(item => item.movie);
          
          setMovies(moviesWithShowtime);
        }).catch(err => {
          console.error("Lỗi khi kiểm tra suất chiếu:", err);
          setMovies([]);
        });
      })
      .catch(err => {
        console.error('Lỗi tải phim:', err);
        setMovies([]);
      });
  }, [selectedTheater, selectedDate]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const styles = {
    movieContainer: {
      padding: '40px 20px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    },
    filterSection: {
      padding: '30px 20px',
      background: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginBottom: '30px',
    },
    scrollableBox: {
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 200px)',
      paddingBottom: '20px',
      background: '#f9f9f9',
      borderRadius: '8px',
      marginBottom: '20px',
    },
    movieCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '1rem',
      marginBottom: '1.5rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      textAlign: 'center',
    },
    movieCardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    },
    movieImage: {
      width: '100%',
      borderRadius: '16px',
      marginBottom: '8px',
      objectFit: 'cover',
      height: '280px',
    },
    movieTitle: {
      color: '#1e4ca3',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
    },
    movieDetail: {
      margin: '0.25rem 0',
      color: '#374151',
    },
    button: {
      marginTop: '10px',
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '0.5rem 1rem',
    },
    noShowtime: {
      color: 'gray',
      marginTop: '10px',
    },
    title: {
      fontSize: '26px',
      textTransform: 'uppercase',
      fontWeight: 'bold',
      borderBottom: '2px solid #ccc',
      display: 'inline-block',
      marginBottom: '24px',
    },
    dateButton: {
      minWidth: '100px',
      height: '60px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
    }
  };

  return (
    <Layout style={{ minHeight: '150vh', overflow: 'auto' }}>
      <HeaderMenu />
      <Content style={{ padding: '0 20px', marginTop: '600px', flex: '1 0 auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 0' }}>
          <Carousel autoplay>
            {ads.map((ad, index) => (
              <div key={index}>
                <img
                  style={{ width: '100%', height: '450px', objectFit: 'cover' }}
                  src={ad.image_url}
                  alt={ad.title || `Banner ${index + 1}`}
                />
              </div>
            ))}
          </Carousel>
        </div>

        <div style={{ padding: '20px', background: '#fff', margin: '20px 0' }}>
          <h2>Giới Thiệu</h2>
          <p>
            Alpha Cinemas mang đến cho bạn những bộ phim bom tấn và trải nghiệm giải trí đỉnh cao tại các rạp chiếu
            phim hiện đại trên toàn quốc. Với công nghệ âm thanh và hình ảnh tiên tiến, chúng tôi cam kết mang lại không
            gian xem phim tuyệt vời nhất.
          </p>

          <div style={styles.movieContainer}>
            <h2 style={styles.title}>🎬 Lịch Chiếu Theo Rạp</h2>

            {/* Chọn rạp */}
            <div style={styles.filterSection}>
              <h3>🎭 Chọn rạp chiếu</h3>
              <Select
                style={{ width: '100%', maxWidth: '400px' }}
                placeholder="Chọn rạp chiếu"
                size="large"
                value={selectedTheater}
                onChange={(value) => setSelectedTheater(value)}
                allowClear
              >
                {theaters.map(theater => (
                  <Option key={theater.id} value={theater.id}>
                    {theater.name} - {theater.address}
                  </Option>
                ))}
              </Select>
            </div>

            {/* Box scroll riêng cho phần chọn ngày và danh sách phim */}
            {selectedTheater && (
              <div style={styles.scrollableBox}>
                {/* Chọn ngày */}
                <div style={styles.filterSection}>
                  <h3>📅 Chọn ngày chiếu</h3>
                  <Row gutter={[16, 16]}>
                    {dates.map(date => (
                      <Col key={date.format('YYYY-MM-DD')} xs={12} sm={8} md={6} lg={4}>
                        <Button
                          type={date.isSame(selectedDate, 'day') ? 'primary' : 'default'}
                          onClick={() => setSelectedDate(date)}
                          style={styles.dateButton}
                          block
                        >
                          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                            {date.format('DD/MM')}
                          </div>
                          <div style={{ fontSize: '12px' }}>
                            {date.format('dddd')}
                          </div>
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </div>

                {/* Danh sách phim */}
                {selectedDate && (
                  <div>
                    <h3 style={{ marginBottom: '20px' }}>
                      🎥 Phim chiếu ngày {selectedDate.format('DD/MM/YYYY')}
                    </h3>
                    {movies.length === 0 ? (
                      <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        Không có phim chiếu trong thời gian này
                      </p>
                    ) : (
                      <Row gutter={[24, 32]}>
                        {movies.map((movie) => (
                          <Col xs={12} sm={8} md={6} lg={4} key={movie.id}>
                            <div
                              style={styles.movieCard}
                              onMouseEnter={e => {
                                e.currentTarget.style.transform = styles.movieCardHover.transform;
                                e.currentTarget.style.boxShadow = styles.movieCardHover.boxShadow;
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = styles.movieCard.boxShadow;
                              }}
                            >
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                style={styles.movieImage}
                              />
                              <h4 style={styles.movieTitle}>{movie.title}</h4>
                              <p style={styles.movieDetail}><strong>Thể loại:</strong> {movie.genre}</p>
                              <p style={styles.movieDetail}><strong>Thời lượng:</strong> {movie.duration} phút</p>

                              <Link 
                                to={`/showTimes/${movie.id}`}
                                state={{
                                  preSelectedTheater: selectedTheater,
                                  preSelectedDate: selectedDate.format('YYYY-MM-DD')
                                }}
                              >
                                <button style={styles.button}>Mua vé</button>
                              </Link>
                            </div>
                          </Col>
                        ))}
                      </Row>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <h2>Danh Sách Rạp Chiếu</h2>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card title="Alpha Cinemas Hà Nội" bordered={false}>
                <p>Địa chỉ: 123 Đường Láng, Đống Đa, Hà Nội</p>
                <p>Hotline: 0905 123 456</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Alpha Cinemas TP.HCM" bordered={false}>
                <p>Địa chỉ: 456 Lê Lợi, Quận 1, TP.HCM</p>
                <p>Hotline: 0905 654 321</p>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card title="Alpha Cinemas Đà Nẵng" bordered={false}>
                <p>Địa chỉ: 789 Hải Châu, Đà Nẵng</p>
                <p>Hotline: 0905 987 654</p>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default Home;