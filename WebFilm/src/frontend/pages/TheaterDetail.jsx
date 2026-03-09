import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Select, Spin, message, Modal, Button, Divider } from 'antd';
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const { Option } = Select;

const TheaterDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [provinceList, setProvinceList] = useState([]);
  const [theaterList, setTheaterList] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [theaterInfo, setTheaterInfo] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [theaterIntroBanner, setTheaterIntroBanner] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const provinceId = params.get('province_id');
    const theaterId = params.get('theater_id');

    if (!provinceId || !theaterId) {
      setShowSelectionModal(true);
    } else {
      setSelectedProvince(parseInt(provinceId));
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
        if (res.data.length === 0) {
          message.warning('Tỉnh này chưa có rạp phim');
        }
      })
      .catch(() => message.error('Lỗi tải danh sách rạp'));
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedTheater) {
      fetchTheaterInfo();
      fetchMoviesByTheater();
      fetchTheaterIntroBanner();
    }
  }, [selectedTheater]);

  const fetchTheaterInfo = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/theaters/${selectedTheater}`);
      setTheaterInfo(response.data);
    } catch (error) {
      console.error('Lỗi tải thông tin rạp:', error);
    }
  };

  const fetchMoviesByTheater = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/theaters/${selectedTheater}/upcoming-movies`
      );
      setMovies(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách phim');
    } finally {
      setLoading(false);
    }
  };

  const fetchTheaterIntroBanner = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/theater-intro-banners?theater_id=${selectedTheater}`
      );
      
      if (response.data && response.data.length > 0) {
        setTheaterIntroBanner(response.data[0].image_url);
      }
    } catch (error) {
      console.error('Lỗi tải theater intro banner:', error);
    }
  };

  const handleConfirmSelection = () => {
    if (!selectedProvince) {
      message.warning('Vui lòng chọn tỉnh/thành phố');
      return;
    }
    if (!selectedTheater) {
      message.warning('Vui lòng chọn rạp phim');
      return;
    }

    navigate(`/theaters?province_id=${selectedProvince}&theater_id=${selectedTheater}`);
    setShowSelectionModal(false);
  };

  const handleChangeTheater = () => {
    setShowSelectionModal(true);
  };

  const styles = {
    pageContainer: {
      maxWidth: '1500px',
      margin: '24px auto',
      padding: '0 20px',
      paddingTop: '120px',
      width: '185vh',
      marginTop :"1000px"
    },
    headerSection: {
      background: 'linear-gradient(135deg, #4a2c2a 0%, #6d4c41 100%)',
      padding: '32px 40px',
      borderRadius: '16px',
      marginBottom: '30px',
      boxShadow: '0 8px 24px rgba(74, 44, 42, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      color: 'white',
    },
    headerLeft: {
      flex: 1,
    },
    theaterTitle: {
      fontSize: '32px',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    breadcrumb: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.85)',
    },
    changeTheaterButton: {
      background: 'rgba(255, 255, 255, 0.2)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      color: 'white',
      padding: '12px 28px',
      fontSize: '15px',
      fontWeight: '600',
      height: 'auto',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backdropFilter: 'blur(10px)',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      transition: 'all 0.3s ease',
    },
    mainContent: {
      display: 'flex',
      gap: '30px',
      marginBottom: '30px',
    },
    leftColumn: {
      flex: '0 0 500px',
    },
    rightColumn: {
      flex: 1,
    },
    bannerImage: {
      width: '100%',
      height: 'auto',
      borderRadius: '16px',
      marginBottom: '20px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    },
    infoBox: {
      backgroundColor: '#fff',
      padding: '28px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    infoRow: {
      display: 'flex',
      alignItems: 'flex-start',
      marginBottom: '20px',
      fontSize: '15px',
      lineHeight: '1.6',
    },
    infoLabel: {
      fontWeight: '600',
      marginRight: '12px',
      minWidth: '90px',
      color: '#333',
    },
    infoValue: {
      color: '#666',
      flex: 1,
    },
    moviesSection: {
      backgroundColor: '#fff',
      padding: '28px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    sectionTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#1a1a1a',
      marginBottom: '24px',
      textTransform: 'uppercase',
      borderBottom: '3px solid #4a2c2a',
      paddingBottom: '12px',
      display: 'inline-block',
    },
    movieGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '20px',
    },
    movieCard: {
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      cursor: 'pointer',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
    moviePoster: {
      width: '100%',
      height: '300px',
      objectFit: 'cover',
    },
    movieOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 70%, transparent 100%)',
      padding: '20px 16px',
      color: '#fff',
    },
    movieTitle: {
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '6px',
    },
    movieMeta: {
      fontSize: '13px',
      opacity: 0.9,
    },
    mapSection: {
      backgroundColor: '#fff',
      padding: '28px',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    },
    mapContainer: {
      width: '100%',
      height: '400px',
      borderRadius: '12px',
      overflow: 'hidden',
      marginTop: '20px',
    },
  };

  return (
    <div style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Modal
        title="Chọn rạp phim"
        open={showSelectionModal}
        onOk={handleConfirmSelection}
        onCancel={() => {
          if (!theaterInfo) {
            navigate('/');
          } else {
            setShowSelectionModal(false);
          }
        }}
        okText="Xác nhận"
        cancelText={theaterInfo ? "Hủy" : "Quay lại"}
        width={600}
      >
        <div style={{ padding: '20px 0' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Tỉnh/Thành phố
            </label>
            <Select
              placeholder="Chọn tỉnh/thành phố"
              style={{ width: '100%' }}
              value={selectedProvince}
              onChange={(value) => {
                setSelectedProvince(value);
                setSelectedTheater(null);
              }}
              size="large"
            >
              {provinceList.map(province => (
                <Option key={province.id} value={province.id}>
                  {province.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
              Rạp phim
            </label>
            <Select
              placeholder="Chọn rạp phim"
              style={{ width: '100%' }}
              value={selectedTheater}
              onChange={setSelectedTheater}
              disabled={!theaterList.length}
              size="large"
            >
              {theaterList.map(theater => (
                <Option key={theater.id} value={theater.id}>
                  {theater.name}
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </Modal>

      {theaterInfo && (
        <div style={styles.pageContainer}>
          {/* Header với gradient đẹp */}
          <div style={styles.headerSection}>
            <div style={styles.headerLeft}>
              <h1 style={styles.theaterTitle}>
                <EnvironmentOutlined />
                {theaterInfo.name}
              </h1>
              <div style={styles.breadcrumb}>
                Trang chủ / Rạp chiếu phim / {theaterInfo.province_name || 'Hà Nội'} / {theaterInfo.name}
              </div>
            </div>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleChangeTheater}
              style={styles.changeTheaterButton}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Chọn lại rạp
            </Button>
          </div>

          {/* Main Content */}
          <div style={styles.mainContent}>
            {/* Left Column - Banner & Info */}
            <div style={styles.leftColumn}>
              <img 
                src={theaterIntroBanner || 'https://via.placeholder.com/500x350?text=Theater+Image'}
                alt={theaterInfo.name}
                style={styles.bannerImage}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x350?text=Theater+Image';
                }}
              />

              <div style={styles.infoBox}>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Tên rạp:</span>
                  <span style={styles.infoValue}>{theaterInfo.name}</span>
                </div>

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Địa chỉ:</span>
                  <span style={styles.infoValue}>{theaterInfo.address}</span>
                </div>

                {theaterInfo.hotline && (
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Hotline:</span>
                    <span style={styles.infoValue}>{theaterInfo.hotline}</span>
                  </div>
                )}

                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Giờ mở cửa:</span>
                  <span style={styles.infoValue}>{theaterInfo.opening_hours || '08:00 - 23:00'}</span>
                </div>

                <Divider style={{ margin: '20px 0' }} />

                <div style={styles.infoRow}>
                  <span style={styles.infoValue}>
                    {theaterInfo.description || `${theaterInfo.name} là một trong những rạp chiếu phim hiện đại với hệ thống âm thanh và hình ảnh tiên tiến nhất. Chúng tôi cam kết mang đến trải nghiệm xem phim tuyệt vời nhất cho khán giả.`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column - Movies */}
            <div style={styles.rightColumn}>
              <div style={styles.moviesSection}>
                <h2 style={styles.sectionTitle}>Phim đang hot</h2>
                
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px' }}>
                    <Spin size="large" />
                  </div>
                ) : movies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                    Hiện chưa có phim đang chiếu
                  </div>
                ) : (
                  <div style={styles.movieGrid}>
                    {movies.slice(0, 4).map(movie => (
                      <a 
                        key={movie.id}
                        href={`/showtimes/${movie.id}?theater_id=${selectedTheater}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div 
                          style={styles.movieCard}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-6px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                          }}
                        >
                          <img 
                            src={movie.poster}
                            alt={movie.title}
                            style={styles.moviePoster}
                          />
                          <div style={styles.movieOverlay}>
                            <div style={styles.movieTitle}>{movie.title}</div>
                            <div style={styles.movieMeta}>
                              {movie.genre} • {movie.duration} phút
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div style={styles.mapSection}>
            <h2 style={styles.sectionTitle}>Bản đồ</h2>
            <div style={styles.mapContainer}>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${encodeURIComponent(theaterInfo.address)}&output=embed`}
                allowFullScreen
              />
            </div>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(theaterInfo.address)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button 
                  type="primary" 
                  icon={<EnvironmentOutlined />}
                  size="large"
                  style={{
                    background: 'linear-gradient(135deg, #4a2c2a 0%, #6d4c41 100%)',
                    border: 'none',
                    height: '48px',
                    padding: '0 32px',
                    fontWeight: '600',
                  }}
                >
                  Xem trên Google Maps
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TheaterDetail;