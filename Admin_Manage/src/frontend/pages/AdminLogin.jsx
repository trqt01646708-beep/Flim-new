import React, { useState } from 'react';
import { Form, Input, Button, Typography, Card, message } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5001/api/admin/auth/login', values);
      localStorage.setItem('admin_token', res.data.token);
      localStorage.setItem('admin_info', JSON.stringify(res.data.admin));

      message.success('Đăng nhập thành công');

      const role = res.data.admin.role;
      if (role === 'super_admin') {
        navigate('/admin/movies');
      } else if (role === 'theater_admin') {
        navigate('/admin/theater/movies');
      } else {
        message.error('Vai trò không xác định');
      }
    } catch (err) {
      message.error(err.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: {

      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #c8d9fbff, #f2f2f2ff)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '8px', // Giảm padding để mở rộng chiều ngang
      width: '345%', // Đảm bảo toàn bộ chiều ngang
    },
    card: {
      width: '30%',
      maxWidth: '1800px', // Tăng chiều rộng tối đa của thẻ
      margin: '0 auto',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(10px)',
      minWidth: '400px', // thêm minWidth để không bị bóp quá nhỏ
    },
    cardBody: {
      padding: '48px',
    },
    title: {
      textAlign: 'center',
      color: '#1e293b',
      marginBottom: '40px',
      fontSize: '2.25rem',
      fontWeight: '700',
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '32px',
    },
    formItemLabel: {
      color: '#374151',
      fontSize: '1.125rem',
      fontWeight: '500',
    },
    input: {
      height: '48px',
      borderRadius: '8px',
      fontSize: '1rem',
    },
    button: {
      width: '100%',
      height: '56px',
      backgroundColor: '#3b82f6',
      borderColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: '8px',
      fontWeight: '600',
      fontSize: '1.125rem',
      transition: 'all 0.3s ease',
    },
    buttonHover: {
      backgroundColor: '#2563eb',
      transform: 'scale(1.02)',
    },
  };

  return (
    <div style={styles.container}>
      <Card 
        style={styles.card}
        bodyStyle={styles.cardBody}
      >
        <Title 
          level={2} 
          style={styles.title}
        >
          Đăng nhập Admin
        </Title>
        <Form 
          layout="vertical" 
          onFinish={onFinish}
          style={styles.form}
        >
          <Form.Item 
            name="username" 
            label={<span style={styles.formItemLabel}>Tên đăng nhập</span>}
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Nhập tên đăng nhập"
              style={styles.input}
              size="large"
            />
          </Form.Item>
          <Form.Item 
            name="password" 
            label={<span style={styles.formItemLabel}>Mật khẩu</span>}
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Nhập mật khẩu"
              style={styles.input}
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              style={styles.button}
              onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.buttonHover)}
              onMouseLeave={(e) => Object.assign(e.currentTarget.style, { ...styles.button, transform: 'scale(1)' })}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLogin;