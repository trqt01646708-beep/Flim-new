import React, { useEffect, useState } from 'react';
import { Select, Row, Col, Card, message, Spin, Alert } from 'antd';
import axios from 'axios';

const { Option } = Select;

const Prices = () => {
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [bannerData, setBannerData] = useState(null);
  const [loading, setLoading] = useState({ provinces: false, theaters: false, banner: false });
  const [error, setError] = useState(null);
  const [showDefaultBanner, setShowDefaultBanner] = useState(false);

  // Load provinces và banner mặc định khi component mount
  useEffect(() => {
    const source = axios.CancelToken.source();
    
    // Load provinces
    setLoading(prev => ({ ...prev, provinces: true }));
    axios.get('http://localhost:5000/api/provinces', { cancelToken: source.token })
      .then(res => {
        console.log('Provinces loaded:', res.data);
        setProvinces(res.data);
      })
      .catch(err => {
        if (axios.isCancel(err)) return;
        console.error('Error loading provinces:', err);
        message.error('Không tải được danh sách tỉnh');
        setProvinces([]);
      })
      .finally(() => setLoading(prev => ({ ...prev, provinces: false })));

    // TỰ ĐỘNG load banner mặc định
    loadDefaultBanner();

    return () => source.cancel('Component unmounted');
  }, []); // Chỉ chạy 1 lần khi mount

  // Lấy danh sách rạp theo tỉnh
  useEffect(() => {
    if (!selectedProvince) {
      setTheaters([]);
      setSelectedTheater(null);
      // KHÔNG reset banner khi chưa chọn tỉnh, giữ banner mặc định
      return;
    }
    const source = axios.CancelToken.source();
    setLoading(prev => ({ ...prev, theaters: true }));
    axios.get(`http://localhost:5000/api/theaters?province_id=${selectedProvince}`, { cancelToken: source.token })
      .then(res => {
        console.log('Theaters loaded:', res.data);
        setTheaters(res.data);
      })
      .catch(err => {
        if (axios.isCancel(err)) return;
        console.error('Error loading theaters:', err);
        message.error('Không tải được danh sách rạp');
        setTheaters([]);
      })
      .finally(() => setLoading(prev => ({ ...prev, theaters: false })));

    return () => source.cancel('Component unmounted');
  }, [selectedProvince]);

  // Lấy banner theo rạp đã chọn
  useEffect(() => {
    if (!selectedTheater) {
      // Nếu không chọn rạp cụ thể, không làm gì (giữ banner mặc định)
      return;
    }
    
    const source = axios.CancelToken.source();
    setLoading(prev => ({ ...prev, banner: true }));
    setError(null);
    setShowDefaultBanner(false); // Tắt trạng thái mặc định khi chọn rạp cụ thể
    
    console.log('Fetching banner for theater:', selectedTheater);
    
    axios.get(`http://localhost:5000/api/ticket-banners?theater_id=${selectedTheater}`, { 
      cancelToken: source.token,
      timeout: 10000
    })
      .then(res => {
        console.log('Banner API response:', res.data);
        
        if (res.data.length > 0) {
          const banner = res.data[0];
          console.log('Banner data:', banner);
          
          setBannerData(banner);
          setError(null);
        } else {
          console.log('No banner found for theater:', selectedTheater);
          setBannerData(null);
          setError('Rạp này chưa có banner giá vé');
        }
      })
      .catch(err => {
        if (axios.isCancel(err)) return;
        
        console.error('Error loading banner:', err);
        setBannerData(null);
        
        if (err.response?.status === 404) {
          setError('Không tìm thấy banner cho rạp này');
        } else if (err.code === 'ECONNREFUSED') {
          setError('Không thể kết nối đến server');
        } else {
          setError('Lỗi khi tải banner giá vé');
        }
      })
      .finally(() => setLoading(prev => ({ ...prev, banner: false })));

    return () => source.cancel('Component unmounted');
  }, [selectedTheater]);

  // Hàm để load banner mặc định từ Hà Nội
  const loadDefaultBanner = () => {
    setLoading(prev => ({ ...prev, banner: true }));
    setError(null);
    
    console.log('Loading default Hanoi banner...');
    
    axios.get('http://localhost:5000/api/ticket-banners/default', { timeout: 10000 })
      .then(res => {
        console.log('Default banner response:', res.data);
        
        if (res.data.length > 0) {
          const banner = res.data[0];
          setBannerData(banner);
          setShowDefaultBanner(true);
          setError(null);
          console.log(`Loaded default banner from: ${banner.theater_name}`);
        } else {
          setError('Không tìm thấy banner mặc định');
        }
      })
      .catch(err => {
        console.error('Error loading default banner:', err);
        setBannerData(null);
        setError('Lỗi khi tải banner mặc định');
      })
      .finally(() => setLoading(prev => ({ ...prev, banner: false })));
  };

  // Hàm để xử lý URL hình ảnh
  const getImageUrl = (banner) => {
    if (!banner || !banner.image_url) return null;
    
    const originalUrl = banner.image_url;
    console.log('Processing image URL:', originalUrl);
    
    // Nếu là external URL (không chứa localhost)
    if (originalUrl.startsWith('http') && !originalUrl.includes('localhost')) {
      // Sử dụng proxy endpoint
      const proxyUrl = `http://localhost:5000/proxy/image?url=${encodeURIComponent(originalUrl)}`;
      console.log('Using proxy for external URL:', proxyUrl);
      return proxyUrl;
    }
    
    // Nếu là local URL, trả về nguyên bản
    return originalUrl;
  };

  const selectedTheaterName = theaters.find(t => t.id === selectedTheater)?.name;
  const finalImageUrl = getImageUrl(bannerData);

  const containerStyle = {
    width: '100vw',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    background: '#f0f2f5',
    boxSizing: 'border-box',
    paddingTop: '500px', // Thêm padding top để tránh bị che
    minHeight: 'calc(100vh - 100px)', // Đảm bảo có đủ chiều cao
  };

  const contentStyle = {
    maxWidth: '900px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    fontFamily: 'Arial, sans-serif',
  };

  const titleStyle = {
    textAlign: 'center',
    color: '#1a202c',
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '24px',
  };

  const selectStyle = {
    width: '100%',
    height: '40px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.3s ease',
  };

  const labelStyle = {
    display: 'block',
    color: '#4a5568',
    fontSize: '16px',
    marginBottom: '8px',
    fontWeight: '600',
  };

  const cardStyle = {
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#ffffff',
  };

  const bannerTitleStyle = {
    textAlign: 'center',
    color: '#2d3748',
    fontSize: '22px',
    fontWeight: 'bold',
    marginBottom: '16px',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>Bảng Giá Vé</h1>

        <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
          <Col span={12}>
            <label style={labelStyle}><strong>Chọn tỉnh:</strong></label>
            <Select
              style={{
                ...selectStyle,
                ...(loading.provinces && { opacity: 0.6, cursor: 'not-allowed' }),
              }}
              placeholder="Chọn tỉnh"
              onChange={(value) => {
                setSelectedProvince(value);
                setSelectedTheater(null);
                setError(null);
                // KHÔNG reset banner, giữ banner mặc định khi chỉ chọn tỉnh
              }}
              loading={loading.provinces}
              disabled={loading.provinces || provinces.length === 0}
            >
              {provinces.map(p => (
                <Option key={p.id} value={p.id} style={{ fontSize: '16px' }}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <label style={labelStyle}><strong>Chọn rạp:</strong></label>
            <Select
              style={{
                ...selectStyle,
                ...(loading.theaters && { opacity: 0.6, cursor: 'not-allowed' }),
              }}
              placeholder="Chọn rạp"
              onChange={(value) => setSelectedTheater(value)}
              value={selectedTheater}
              loading={loading.theaters}
              disabled={!selectedProvince || loading.theaters || theaters.length === 0}
            >
              {theaters.map(t => (
                <Option key={t.id} value={t.id} style={{ fontSize: '16px' }}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

       

        {error && (
          <Alert
            message="Lỗi tải banner"
            description={error}
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        {loading.banner && (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Spin size="large" />
            <p style={{ marginTop: '16px' }}>
              {showDefaultBanner ? 'Đang tải bảng giá mặc định...' : 'Đang tải banner giá vé...'}
            </p>
          </div>
        )}

        {finalImageUrl && !loading.banner && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={bannerTitleStyle}>
              Bảng Giá Vé - {selectedTheaterName || bannerData.theater_name}
              {showDefaultBanner && (
                <span style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'normal' }}>
                  {' '}(Tham khảo)
                </span>
              )}
            </h2>
            <Card style={cardStyle}>
              <img
                src={finalImageUrl}
                alt="Bảng giá vé"
                style={{ 
                  width: '100%', 
                  borderRadius: '8px', 
                  objectFit: 'contain',
                  maxHeight: '600px'
                }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  console.error('Failed URL:', finalImageUrl);
                  setError('Không thể tải hình ảnh banner');
                }}
                onLoad={() => {
                  console.log('Image loaded successfully from:', finalImageUrl);
                }}
              />
            </Card>
            
            {showDefaultBanner && (
              <div style={{ 
                textAlign: 'center', 
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#e6f7ff',
                borderRadius: '8px',
                border: '1px solid #91d5ff'
              }}>
                <p style={{ margin: 0, color: '#1890ff', fontSize: '14px' }}>
                  Đây là bảng giá tham khảo. Vui lòng chọn tỉnh và rạp để xem giá chính xác.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prices;