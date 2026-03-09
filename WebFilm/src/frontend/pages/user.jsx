// user.jsx - Phiên bản đầy đủ, tích hợp AuthContext và token
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, Form, Input, Button, message, Typography, Card, Divider, Row, Col, Select, Table, Tag } from 'antd';
import { useAuth } from "../../contexts/AuthContext";

const { Title, Text } = Typography;

const User = () => {
  const { user: storedUser, token } = useAuth(); // Lấy user và token từ context
  const userId = storedUser?.id;
  const [userProfile, setUserProfile] = useState(null);
  const [form] = Form.useForm();
  const [districts, setDistricts] = useState([]);

  const fetchUserProfile = async () => {
    if (!userId || !token) {
      console.error('❌ userId hoặc token không tồn tại:', { userId, hasToken: !!token });
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Response đầy đủ:', response.data);
      console.log('💎 Points từ API:', response.data.points);
      console.log('💰 MoneySpent từ API:', response.data.moneySpent);
      
      if (response.data) {
        const formattedData = {
          ...response.data,
          points: parseInt(response.data.points) || 0,
          moneySpent: parseFloat(response.data.moneySpent) || 0,
          dateOfBirth: response.data.dateOfBirth ? new Date(response.data.dateOfBirth).toISOString().split('T')[0] : null,
        };
        
        console.log('📦 Formatted data:', {
          points: formattedData.points,
          moneySpent: formattedData.moneySpent
        });
        
        setUserProfile(formattedData);
        form.setFieldsValue(formattedData);
      } else {
        console.warn('⚠️ Không có dữ liệu trả về');
      }
    } catch (error) {
      console.error('❌ Lỗi khi lấy thông tin người dùng:', error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        const { logout } = useAuth();
        logout();
        window.location.href = '/login';
      }
    }
  };

  useEffect(() => {
    if (userId && token) {
      console.log('🔄 Component mounted, fetching user profile for ID:', userId);
      fetchUserProfile();
    } else {
      console.error('❌ No userId or token found in context');
    }
  }, [userId, token]);

  const handleProvinceChange = (value) => {
    let newDistricts = [];
    switch (value) {
      case 'Hà Nội':
        newDistricts = ['Hoàn Kiếm', 'Ba Đình', 'Hai Bà Trưng', 'Đống Đa', 'Cầu Giấy', 'Tây Hồ', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông', 'Sơn Tây', 'Ba Vì', 'Chương Mỹ', 'Đan Phượng', 'Đông Anh', 'Gia Lâm', 'Mê Linh', 'Phú Xuyên', 'Phúc Thọ', 'Quốc Oai', 'Sóc Sơn', 'Thạch Thất', 'Thanh Oai', 'Thanh Trì', 'Thường Tín', 'Ứng Hòa'];
        break;
      case 'TP. Hồ Chí Minh':
        newDistricts = ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Thủ Đức', 'Bình Tân', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Bình Chánh', 'Cần Giờ'];
        break;
      // Thêm các tỉnh khác nếu cần
      default:
        newDistricts = [];
    }
    setDistricts(newDistricts);
    form.setFieldsValue({ district: undefined });
  };

  const onFinish = async (values) => {
    console.log('Dữ liệu gửi đi:', values);
    if (!token) {
      message.error('Token không tồn tại, vui lòng đăng nhập lại!');
      return;
    }
    try {
      await axios.put(`http://localhost:5000/api/users/profile`, values, {
        headers: { Authorization: `Bearer ${token}` }
      });
      message.success('Cập nhật thông tin thành công!');
      fetchUserProfile(); // Refresh data
    } catch (error) {
      console.error('❌ Lỗi khi cập nhật thông tin:', error.response?.data || error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        const { logout } = useAuth();
        logout();
        window.location.href = '/login';
      } else {
        message.error('Cập nhật thông tin thất bại!');
      }
    }
  };

  if (!userProfile) {
    return (
      <div style={{ padding: '24px 60px', maxWidth: '1400px', margin: '0 auto' }}>
        <p>Đang tải thông tin người dùng...</p>
      </div>
    );
  }

  console.log('🎨 Rendering with userProfile:', {
    points: userProfile.points,
    moneySpent: userProfile.moneySpent
  });

  // Cấu hình cột cho bảng Phim đã xem
  const columns = [
    {
      title: 'Tên phim',
      dataIndex: 'movie_title',
      key: 'movie_title',
    },
    {
      title: 'Số vé',
      dataIndex: 'seat_info',
      key: 'seat_info',
      render: (text) => text ? text.split(',').length : 1,
    },
    {
      title: 'Ngày giờ',
      dataIndex: 'show_time',
      key: 'show_time',
      render: (text) => new Date(text).toLocaleString('vi-VN'),
    },
    {
      title: 'Rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
    },
    {
      title: 'Phòng',
      dataIndex: 'room_number',
      key: 'room_number',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'total_price',
      key: 'total_price',
      render: (text) => (parseFloat(text) || 0).toLocaleString('vi-VN') + 'đ',
    },
    {
      title: 'Điểm dùng',
      dataIndex: 'points_used',
      key: 'points_used',
      render: (text) => text || 0,
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount_amount',
      key: 'discount_amount',
      render: (text) => (parseFloat(text) || 0).toLocaleString('vi-VN') + 'đ',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'confirmed' ? 'green' : 'blue'}>{status}</Tag>
      ),
    },
  ];

  const items = [
    {
      key: '1',
      label: '👤 Thông tin cá nhân',
      children: (
        <Card style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px' }}>
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  {userProfile.points.toLocaleString()}
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>💎 Điểm tích lũy</Text>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <Title level={3} style={{ color: 'white', margin: 0 }}>
                  {(userProfile.moneySpent || 0).toLocaleString()}đ
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>💰 Tổng chi tiêu</Text>
                
              </div>
            </Col>
          </Row>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
            💡 Mỗi 80,000đ chi tiêu = 1,500 điểm | 1,000 điểm = 5,000đ giảm giá
          </Text>
          <Divider />

          <Form form={form} name="updateUser" onFinish={onFinish} layout="vertical">
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item name="username" label="👤 Tên đăng nhập">
                  <Input disabled />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="📧 Email">
                  <Input disabled />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="phone" label="📱 Số điện thoại">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="gender" label="⚥ Giới tính">
                  <Select placeholder="Chọn giới tính">
                    <Select.Option value="Nam">Nam</Select.Option>
                    <Select.Option value="Nữ">Nữ</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="cccd" label="🪪 Số CCCD">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="dateOfBirth" label="🎂 Ngày sinh">
                  <Input type="date" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="province" label="🏙️ Tỉnh">
                  <Select placeholder="Chọn tỉnh" onChange={handleProvinceChange}>
                    <Select.Option value="Hà Nội">Hà Nội</Select.Option>
                    <Select.Option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</Select.Option>
                    {/* Thêm các tỉnh khác nếu cần */}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="district" label="🏘️ Quận/Huyện">
                  <Select placeholder="Chọn quận/huyện">
                    {districts.map(district => (
                      <Select.Option key={district} value={district}>{district}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large">
                💾 Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      key: '2',
      label: '🎥 Phim đã xem',
      children: (
        <Card style={{ width: '100%', background: '#fefefe', padding: '20px 0', minHeight: '400px' }}>
          <Title level={4}>Lịch sử xem phim</Title>
          {userProfile.purchasedMovies && userProfile.purchasedMovies.length > 0 ? (
            <Table
              columns={columns}
              dataSource={userProfile.purchasedMovies}
              rowKey="order_id"
              pagination={{ pageSize: 10 }} 
              style={{ width: '100%', minWidth: '1200px' }}
            />
          ) : (
            <Text type="secondary">Bạn chưa đặt vé phim nào.</Text>
          )}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ paddingTop: '150px', padding: '24px 60px', maxWidth: '1400px', margin: '0 auto' }}>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default User;