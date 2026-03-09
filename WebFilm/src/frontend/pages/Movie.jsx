import React, { useEffect, useState } from 'react';
import { Row, Col, Select, Card, Tabs, Spin, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;
const { TabPane } = Tabs;
const { Meta } = Card;

const Movies = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [provinceList, setProvinceList] = useState([]);
  const [theaterList, setTheaterList] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [activeTab, setActiveTab] = useState('now_showing');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provinceId = params.get('province_id');
    const theaterId = params.get('theater_id');

    if (provinceId) {
      setSelectedProvince(parseInt(provinceId));
    }
    if (theaterId) {
      setSelectedTheater(parseInt(theaterId));
    }
  }, [location.search]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/provinces')
      .then(res => setProvinceList(res.data))
      .catch(() => message.error('Lỗi tải danh sách tỉnh'));
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setTheaterList([]);
      return;
    }
    axios.get(`http://localhost:5000/api/theaters?province_id=${selectedProvince}`)
      .then(res => {
        setTheaterList(res.data);
        
        if (selectedTheater && !res.data.find(t => t.id === selectedTheater)) {
          setSelectedTheater(null);
        }
      })
      .catch(() => message.error('Lỗi tải danh sách rạp'));
  }, [selectedProvince]);

  useEffect(() => {
    fetchMovies();
  }, [selectedProvince, selectedTheater, activeTab]);

  const fetchMovies = () => {
    setLoading(true);
    const params = {};
    if (selectedProvince) params.province_id = selectedProvince;
    if (selectedTheater) params.theater_id = selectedTheater;
    if (activeTab) params.status = activeTab;

    axios.get('http://localhost:5000/api/films', { params })
      .then(res => {
        let validMovies = res.data;
        
        // CHỈ lọc phim hết hạn khi đang ở tab "Đang chiếu"
        if (activeTab === 'now_showing') {
          validMovies = res.data.filter(movie => {
            if (!movie.end_date) return true;
            return new Date(movie.end_date) >= new Date();
          });
        }
        
        setMovies(validMovies);
      })
      .catch(() => message.error('Không thể tải danh sách phim'))
      .finally(() => setLoading(false));
  };

  const updateURLParams = (province, theater) => {
    const params = new URLSearchParams();
    if (province) params.set('province_id', province);
    if (theater) params.set('theater_id', theater);
    
    const newURL = params.toString() ? `/movie?${params.toString()}` : '/movie';
    navigate(newURL, { replace: true });
  };

  const handleProvinceChange = (value) => {
    setSelectedProvince(value);
    setSelectedTheater(null);
    updateURLParams(value, null);
  };

  const handleTheaterChange = (value) => {
    setSelectedTheater(value);
    updateURLParams(selectedProvince, value);
  };

  const styles = {
    container: {
      padding: '24px',
      width: '94vw',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      marginTop: '200px',
      minHeight: 'calc(120vh-100px)',
    },
    title: {
      textAlign: 'center',
      marginBottom: '16px',
      fontSize: '1.75rem',
      fontWeight: '700',
      color: '#1e293b',
    },
    breadcrumb: {
      textAlign: 'center',
      marginBottom: '24px',
      color: '#64748b',
      fontSize: '0.95rem',
    },
    filterRow: {
      marginBottom: '24px',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    select: {
      width: '100%',
      minWidth: '250px',
      borderRadius: '8px',
      border: '2px solid #e5e7eb',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    },
    tabs: {
      textAlign: 'center',
      padding: '20px',
      marginBottom: '24px',
      backgroundColor: '#ffffff',
      borderRadius: '10px',
    },
    tabBarStyle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '30px',
    },
    loading: {
      textAlign: 'center',
      marginTop: '50px',
    },
    movieList: {
      overflowY: 'auto',
      maxHeight: 'calc(100vh - 400px)',
      paddingBottom: '20px',
    },
    movieCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '10px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      padding: '1rem',
      marginBottom: '1.5rem',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      maxWidth: '100%',
    },
    movieCardHover: {
      transform: 'translateY(-3px)',
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.1)',
    },
    movieImage: {
      height: '260px',
      objectFit: 'cover',
      borderRadius: '8px',
    },
    movieTitle: {
      fontWeight: 'bold',
      fontSize: '16px',
      color: '#1e40af',
      marginBottom: '0.5rem',
    },
    movieDetail: {
      margin: '0.5rem 0',
      color: '#374151',
      fontSize: '0.95rem',
    },
    button: {
      width: '100%',
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '0.5rem',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      transition: 'all 0.3s ease',
    },
    comingSoon: {
      color: '#f59e0b',
      fontSize: '0.95rem',
      fontWeight: '600',
      textAlign: 'center',
      marginTop: '10px',
    },
    emptyState: {
      textAlign: 'center',
      padding: '60px 20px',
      color: '#64748b',
    },
    statsBar: {
      textAlign: 'center',
      marginBottom: '20px',
      padding: '12px',
      backgroundColor: '#eff6ff',
      borderRadius: '8px',
      color: '#1e40af',
      fontWeight: '600',
    },
  };

  const selectedTheaterName = theaterList.find(t => t.id === selectedTheater)?.name;
  const selectedProvinceName = provinceList.find(p => p.id === selectedProvince)?.name;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Danh sách phim</h1>
      
      {(selectedProvinceName || selectedTheaterName) && (
        <div style={styles.breadcrumb}>
          {selectedProvinceName && <span>{selectedProvinceName}</span>}
          {selectedProvinceName && selectedTheaterName && <span> → </span>}
          {selectedTheaterName && <span>{selectedTheaterName}</span>}
        </div>
      )}

      <div style={styles.filterRow}>
        <Row gutter={[16, 16]} justify="center">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Chọn tỉnh/thành"
              style={styles.select}
              value={selectedProvince}
              onChange={handleProvinceChange}
              allowClear
              size="large"
            >
              {provinceList.map(province => (
                <Option key={province.id} value={province.id}>{province.name}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Chọn rạp (tùy chọn)"
              style={styles.select}
              value={selectedTheater}
              onChange={handleTheaterChange}
              disabled={!theaterList.length}
              allowClear
              size="large"
            >
              {theaterList.map(theater => (
                <Option key={theater.id} value={theater.id}>{theater.name}</Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      <div style={styles.tabs}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          size="large"
          centered
          tabBarStyle={styles.tabBarStyle}
        >
          <TabPane tab="Đang chiếu" key="now_showing" />
          <TabPane tab="Sắp chiếu" key="coming_soon" />
          <TabPane tab="Suất chiếu đặc biệt" key="special" />
        </Tabs>
      </div>

      {!loading && movies.length > 0 && (
        <div style={styles.statsBar}>
          Tìm thấy {movies.length} bộ phim
        </div>
      )}

      {loading ? (
        <div style={styles.loading}>
          <Spin size="large" tip="Đang tải danh sách phim..." />
        </div>
      ) : movies.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>Không tìm thấy phim</h3>
          <p>Vui lòng thử chọn rạp hoặc tỉnh/thành khác</p>
        </div>
      ) : (
        <div style={styles.movieList}>
          <Row gutter={[16, 24]}>
            {movies.map(movie => (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} key={movie.id}>
                <Card
                  hoverable
                  style={styles.movieCard}
                  cover={<img alt={movie.title} src={movie.poster} style={styles.movieImage} />}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = styles.movieCardHover.transform;
                    e.currentTarget.style.boxShadow = styles.movieCardHover.boxShadow;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = styles.movieCard.boxShadow;
                  }}
                >
                  <Meta
                    title={<span style={styles.movieTitle}>{movie.title}</span>}
                    description={
                      <>
                        <p style={styles.movieDetail}><strong>Thể loại:</strong> {movie.genre}</p>
                        <p style={styles.movieDetail}><strong>Thời lượng:</strong> {movie.duration} phút</p>
                        {movie.end_date && (
                          <p style={styles.movieDetail}><strong>Chiếu đến:</strong> {new Date(movie.end_date).toLocaleDateString('vi-VN')}</p>
                        )}

                        {movie.status === 'special' ? (
                          <div style={{ marginTop: 10 }}>
                            <a href={`/showTimes/${movie.id}`}>
                              <button 
                                style={styles.button}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                              >
                                Đặt vé
                              </button>
                            </a>
                          </div>
                        ) : movie.status === 'coming_soon' ? (
                          <p style={styles.comingSoon}>Sắp chiếu</p>
                        ) : movie.status === 'now_showing' ? (
                          <div style={{ marginTop: 10 }}>
                            <a href={`/showTimes/${movie.id}`}>
                              <button 
                                style={styles.button}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                              >
                                Đặt vé
                              </button>
                            </a>
                          </div>
                        ) : null}
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Movies;