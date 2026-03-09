import { Form, Input, Button, message, Card, Typography, notification, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

const { Text } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const [errorList, setErrorList] = useState([]);

  const onFinish = async (values) => {
    setErrorMessage('');
    setErrorList([]);

    try {
      const { username, password, email } = values;
      await axios.post('http://localhost:5000/api/auth/register', { 
        username, 
        password, 
        email 
      });
      
      notification.success({
        message: 'Đăng ký thành công',
        description: `Chào mừng ${username} đến với Alpha Cinemas`,
        duration: 3,
        placement: 'topRight',
      });
      
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error('Lỗi đăng ký:', err.response?.data);
      
      const errorData = err.response?.data;
      
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        setErrorList(errorData.errors);
        setErrorMessage(errorData.message);
      } else if (errorData?.message) {
        setErrorMessage(errorData.message);
      } else {
        setErrorMessage('Đăng ký thất bại! Vui lòng kiểm tra lại thông tin.');
      }

      notification.error({
        message: 'Đăng ký thất bại',
        description: errorData?.message || 'Vui lòng kiểm tra lại thông tin',
        duration: 4,
        placement: 'topRight'
      });
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#ffffff',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '480px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          border: '1px solid #e2e8f0'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px', margin: 0 }}>
            Đăng ký tài khoản
          </h1>
          <p style={{ color: '#718096', margin: '8px 0 0 0' }}>Tham gia cùng Alpha Cinemas</p>
        </div>

        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: '16px' }}
          />
        )}

        {errorList.length > 0 && (
          <Alert
            message="Mật khẩu không đáp ứng yêu cầu:"
            description={
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                {errorList.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="warning"
            showIcon
            closable
            onClose={() => setErrorList([])}
            style={{ marginBottom: '16px' }}
          />
        )}

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<span style={{ fontWeight: '500', color: '#4a5568' }}>Tên đăng nhập</span>}
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
              { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
              { max: 50, message: 'Tên đăng nhập không được vượt quá 50 ký tự!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#a0aec0' }} />}
              placeholder="Nhập tên đăng nhập"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '500', color: '#4a5568' }}>Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#a0aec0' }} />}
              placeholder="example@email.com"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '500', color: '#4a5568' }}>Mật khẩu</span>}
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' },
              { pattern: /[A-Z]/, message: 'Mật khẩu phải có ít nhất 1 chữ in hoa!' },
              { pattern: /[a-z]/, message: 'Mật khẩu phải có ít nhất 1 chữ thường!' },
              { pattern: /[0-9]/, message: 'Mật khẩu phải có ít nhất 1 chữ số!' }
            ]}
            hasFeedback
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#a0aec0' }} />}
              placeholder="Nhập mật khẩu"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontWeight: '500', color: '#4a5568' }}>Xác nhận mật khẩu</span>}
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#a0aec0' }} />}
              placeholder="Nhập lại mật khẩu"
              size="large"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>

          <div style={{ 
            background: '#ebf4ff', 
            padding: '14px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            border: '1px solid #bee3f8'
          }}>
            <div style={{ fontWeight: '600', marginBottom: '10px', color: '#2c5282', fontSize: '13px' }}>
              Yêu cầu mật khẩu:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#4a5568' }}>
              <li style={{ marginBottom: '4px' }}>Ít nhất 8 ký tự</li>
              <li style={{ marginBottom: '4px' }}>Có ít nhất 1 chữ IN HOA</li>
              <li style={{ marginBottom: '4px' }}>Có ít nhất 1 chữ thường</li>
              <li>Có ít nhất 1 chữ số</li>
            </ul>
          </div>

          <Form.Item style={{ marginBottom: '16px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              style={{
                height: '48px',
                fontSize: '16px',
                fontWeight: '600',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              Đăng ký
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text style={{ fontSize: '14px', color: '#718096' }}>
              Đã có tài khoản?{' '}
              <Link to="/login" style={{ color: '#667eea', fontWeight: '500' }}>
                Đăng nhập
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;