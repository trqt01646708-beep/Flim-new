import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Descriptions, Spin, message, Button, Modal, Form, Input, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';

const AdminAccount = () => {
  const [adminInfo, setAdminInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [form] = Form.useForm();

  const token = localStorage.getItem('admin_token');

  const fetchAccount = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5001/api/admin/account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminInfo(res.data);
    } catch (err) {
      message.error('Không thể tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleEdit = () => {
    form.setFieldsValue({
      full_name: adminInfo.full_name,
      email: adminInfo.email,
      password: '',
      confirm_password: '',
    });
    setEditModalVisible(true);
  };

  const handleUpdate = async (values) => {
    // Kiểm tra password match nếu có nhập
    if (values.password && values.password !== values.confirm_password) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        full_name: values.full_name,
        email: values.email,
      };

      // Chỉ gửi password nếu có nhập
      if (values.password && values.password.trim() !== '') {
        updateData.password = values.password;
      }

      await axios.put(
        'http://localhost:5001/api/admin/account/update',
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success('Cập nhật thông tin thành công');
      setEditModalVisible(false);
      form.resetFields();
      fetchAccount(); // Reload thông tin
    } catch (err) {
      console.error('Error:', err);
      message.error(err.response?.data?.error || 'Lỗi cập nhật thông tin');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Thông tin tài khoản</span>}
        extra={
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            Cập nhật thông tin
          </Button>
        }
        style={{ maxWidth: 800, margin: '0 auto' }}
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Họ và tên">
            <strong>{adminInfo?.full_name}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Username">
            {adminInfo?.username}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {adminInfo?.email || 'Chưa cập nhật'}
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={adminInfo?.role === 'super_admin' ? 'red' : 'blue'}>
              {adminInfo?.role === 'super_admin' ? 'Super Admin' : 'Quản lý rạp'}
            </Tag>
          </Descriptions.Item>
          {adminInfo?.theater_name && (
            <Descriptions.Item label="Rạp phụ trách">
              <div>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {adminInfo.theater_name}
                </div>
                <div style={{ fontSize: 13, color: '#666' }}>
                  {adminInfo.theater_address}
                </div>
              </div>
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Modal cập nhật thông tin */}
      <Modal
        title="Cập nhật thông tin tài khoản"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={updating}
        okText="Cập nhật"
        cancelText="Hủy"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            name="full_name"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { max: 100, message: 'Họ tên không được quá 100 ký tự' },
            ]}
          >
            <Input placeholder="Nhập họ và tên" size="large" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input placeholder="Nhập email" size="large" />
          </Form.Item>

          <div style={{ 
            background: '#f5f5f5', 
            padding: '12px', 
            borderRadius: '4px', 
            marginBottom: '16px' 
          }}>
            <div style={{ fontWeight: 500, marginBottom: '8px' }}>
              Đổi mật khẩu (tùy chọn)
            </div>
            <div style={{ fontSize: '13px', color: '#666' }}>
              Để trống nếu không muốn đổi mật khẩu
            </div>
          </div>

          <Form.Item
            name="password"
            label="Mật khẩu mới"
            rules={[
              {
                min: 6,
                message: 'Mật khẩu phải có ít nhất 6 ký tự',
              },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới (tùy chọn)" size="large" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Xác nhận mật khẩu mới"
            dependencies={['password']}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!getFieldValue('password') || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAccount;