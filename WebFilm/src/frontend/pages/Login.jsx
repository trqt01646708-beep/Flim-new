import { Form, Input, Button, message, Card } from 'antd';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // Sử dụng context

  const onFinish = async (values) => {
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', values);
      console.log("📦 Dữ liệu trả về:", res.data);
      
      // Thay localStorage bằng context
      login(res.data.user, res.data.token);
      
      message.success("Đăng nhập thành công!");
      navigate('/');
      // Không cần reload nữa
    } catch (err) {
      message.error(err.response?.data?.message || 'Lỗi đăng nhập!');
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card
        title="Đăng nhập"
        style={{
          width: '100%',
          maxWidth: 500,
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng nhập
            </Button>
          </Form.Item>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/register">Chưa có tài khoản?</Link>
            <Link to="#">Quên mật khẩu?</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;