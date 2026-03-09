import React, { useEffect, useState } from 'react';
import { Form, Input, Button, Select, message, Card, Typography, Table, Space, Popconfirm, Modal, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;

const CreateAdmin = () => {
  const [theaters, setTheaters] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const token = localStorage.getItem('admin_token');
  const adminData = JSON.parse(localStorage.getItem('admin_info') || '{}');
  const isSuperAdmin = adminData.role === 'super_admin';

  useEffect(() => {
    fetchTheaters();
    if (isSuperAdmin) {
      fetchAccounts();
    }
  }, []);

  const fetchTheaters = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/admin/set-account/theaters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTheaters(res.data);
    } catch (err) {
      message.error('Không thể tải danh sách rạp');
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await axios.get('http://localhost:5001/api/admin/set-account/accounts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(res.data);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      message.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:5001/api/admin/set-account/accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(res.data.message);
      fetchAccounts();
    } catch (err) {
      console.error('Delete error:', err);
      message.error(err.response?.data?.error || 'Lỗi khi xóa tài khoản');
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      email: account.email,
      full_name: account.full_name,
      assigned_theater_id: account.assigned_theater_id,
      password: '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    form.resetFields();
    setShowModal(true);
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (editingAccount) {
        // Sửa tài khoản
        await axios.put(
          `http://localhost:5001/api/admin/set-account/accounts/${editingAccount.id}`,
          values,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success('Cập nhật tài khoản thành công');
      } else {
        // Tạo mới tài khoản
        await axios.post('http://localhost:5001/api/admin/set-account/create-admin', values, {
          headers: { Authorization: `Bearer ${token}` }
        });
        message.success('Tạo tài khoản thành công');
      }
      
      setShowModal(false);
      setEditingAccount(null);
      form.resetFields();
      fetchAccounts();
    } catch (err) {
      console.error('Error:', err);
      message.error(err.response?.data?.error || 'Lỗi xử lý');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
      fixed: 'left',
    },
    {
      title: 'Tên đăng nhập',
      dataIndex: 'username',
      key: 'username',
      width: 150,
      fixed: 'left',
      render: (username) => <strong>{username}</strong>,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'full_name',
      key: 'full_name',
      width: 180,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220,
    },
    {
      title: 'Rạp được gán',
      key: 'theater',
      width: 280,
      render: (_, record) => (
        <div>
          {record.theater_name ? (
            <>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>
                {record.theater_name}
              </div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {record.theater_address}
              </div>
            </>
          ) : (
            <Tag color="default">Chưa gán rạp</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Được tạo bởi',
      key: 'created_by',
      width: 180,
      render: (_, record) => (
        <div>
          {record.created_by_name ? (
            <>
              <div style={{ fontWeight: 500 }}>{record.created_by_name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                @{record.created_by_username}
              </div>
            </>
          ) : (
            <Tag color="blue">Hệ thống</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            style={{ padding: '4px 8px' }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa tài khoản?"
            description="Hành động này không thể hoàn tác!"
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              type="link" 
              icon={<DeleteOutlined />}
              style={{ padding: '4px 8px' }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Nếu không phải super_admin
  if (!isSuperAdmin) {
    return (
      <Card style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <Title level={4}>Bạn không có quyền truy cập trang này</Title>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card
        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Quản lý tài khoản Admin</span>}
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
            size="large"
          >
            Thêm tài khoản
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loadingAccounts}
          scroll={{ x: 1400 }}
          pagination={{ 
            pageSize: 10,
            showTotal: (total) => `Tổng ${total} tài khoản`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          bordered
        />
      </Card>

      {/* Modal thêm/sửa */}
      <Modal
        open={showModal}
        title={
          <span style={{ fontSize: '16px', fontWeight: 600 }}>
            {editingAccount ? 'Sửa tài khoản Admin' : 'Thêm tài khoản Admin'}
          </span>
        }
        onCancel={() => {
          setShowModal(false);
          setEditingAccount(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        okText={editingAccount ? 'Cập nhật' : 'Tạo tài khoản'}
        cancelText="Hủy"
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish}
          style={{ marginTop: '24px' }}
        >
          {!editingAccount && (
            <Form.Item
              name="username"
              label="Tên đăng nhập"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                { max: 50, message: 'Tên đăng nhập không được quá 50 ký tự' },
              ]}
            >
              <Input placeholder="Nhập tên đăng nhập" size="large" />
            </Form.Item>
          )}

          <Form.Item
            name="password"
            label={editingAccount ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
            rules={[
              { required: !editingAccount, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password 
              placeholder={editingAccount ? 'Nhập mật khẩu mới (tùy chọn)' : 'Nhập mật khẩu'}
              size="large"
            />
          </Form.Item>

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

          <Form.Item
            name="assigned_theater_id"
            label="Rạp được gán"
            rules={[{ required: true, message: 'Vui lòng chọn rạp' }]}
          >
            <Select placeholder="Chọn rạp" size="large" showSearch>
              {theaters.map((theater) => (
                <Option key={theater.id} value={theater.id}>
                  {theater.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CreateAdmin;