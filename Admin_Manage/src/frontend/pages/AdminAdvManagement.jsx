import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Input, Upload, Switch, Select, 
  message, Popconfirm, Space, Image, Tag, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, EyeOutlined, PictureOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const AdminAdvManagement = () => {
  const [banners, setBanners] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();
  const [uploadedImage, setUploadedImage] = useState(null); // Lưu tạm file ảnh
  const [previewImageUrl, setPreviewImageUrl] = useState(null); // URL tạm để hiển thị ảnh

  // Lấy thông tin admin từ localStorage
  const adminData = JSON.parse(localStorage.getItem('admin_info') || '{}');
  const authToken = localStorage.getItem('admin_token');
  const userRole = adminData.role;

  useEffect(() => {
    fetchBanners();
    if (userRole === 'super_admin') {
      fetchTheaters();
    }
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/admin/adv', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBanners(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách banner');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTheaters = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/admin/theater/all', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setTheaters(response.data);
    } catch (error) {
      console.error('Lỗi tải danh sách rạp:', error);
    }
  };

  const handleUpload = (file) => {
    // Tạo URL tạm để hiển thị ảnh trước khi upload
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(file);
    setPreviewImageUrl(previewUrl);
    form.setFieldsValue({ image_path: 'temp' }); // Đặt giá trị tạm để vượt qua validation
    message.success('Đã chọn ảnh, nhấn Thêm để lưu');
    return false; // Ngăn Multer upload ngay lập tức
  };

  const handleSubmit = async (values) => {
    try {
      let imagePath = editingBanner ? editingBanner.image_url : null;
      if (uploadedImage) {
        // Upload ảnh lên server khi nhấn Thêm hoặc Cập nhật
        const formData = new FormData();
        formData.append('banner', uploadedImage);
        const uploadResponse = await axios.post(
          'http://localhost:5001/admin/adv/upload',
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        imagePath = uploadResponse.data.path;
      }

      const submitData = {
        ...values,
        image_path: imagePath,
        theater_id: userRole === 'theater_admin' ? adminData.assigned_theater_id : values.theater_id
      };

      if (editingBanner) {
        await axios.put(
          `http://localhost:5001/admin/adv/${editingBanner.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Cập nhật banner thành công');
      } else {
        await axios.post(
          'http://localhost:5001/api/admin/adv',
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Thêm banner thành công');
      }

      setModalVisible(false);
      resetForm();
      await fetchBanners(); // Làm mới danh sách banner
    } catch (error) {
      message.error(editingBanner ? 'Lỗi cập nhật banner' : 'Lỗi thêm banner');
      console.error(error);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setPreviewImageUrl(banner.image_url);
    setUploadedImage(null); // Reset ảnh mới khi chỉnh sửa
    form.setFieldsValue({
      title: banner.title,
      link: banner.link,
      is_active: banner.is_active,
      theater_id: banner.theater_id || 'global',
      image_path: banner.image_url // Đặt image_path để tránh lỗi validation
    });
    setModalVisible(true);
  };

  const handleDelete = async (bannerId) => {
    try {
      await axios.delete(`http://localhost:5001/admin/adv/${bannerId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      message.success('Xóa banner thành công');
      await fetchBanners(); // Làm mới danh sách banner
    } catch (error) {
      message.error('Lỗi xóa banner');
      console.error(error);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setEditingBanner(null);
    setUploadedImage(null);
    setPreviewImageUrl(null);
  };

  const columns = [
    {
      title: 'Hình ảnh',
      dataIndex: 'image_url',
      key: 'image_url',
      width: 120,
      render: (url) => (
        <Image
          width={100}
          height={60}
          src={url}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          fallback="/placeholder-image.jpg"
        />
      )
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      render: (link) => link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: '#1890ff' }}>
          {link.length > 30 ? `${link.substring(0, 30)}...` : link}
        </a>
      ) : 'Không có'
    },
    {
      title: 'Rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
      render: (theaterName) => (
        <Tag color={theaterName ? 'blue' : 'green'}>
          {theaterName || 'Global'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Tạm dừng'}
        </Tag>
      )
    },
    {
      title: 'Người tạo',
      dataIndex: 'created_by_username',
      key: 'created_by_username',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa banner này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
        <Col>
          <h2>Quản lý Banner</h2>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            Thêm Banner
          </Button>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingBanner ? 'Sửa Banner' : 'Thêm Banner'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            theater_id: userRole === 'theater_admin' ? adminData.assigned_theater_id : 'global'
          }}
        >
          <Form.Item
            label="Tiêu đề"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề banner" />
          </Form.Item>

          <Form.Item 
            label="Hình ảnh"
            name="image_path"
            rules={[{
              required: !editingBanner || uploadedImage,
              message: 'Vui lòng chọn hình ảnh!'
            }]}
          >
            <Upload
              accept="image/*"
              beforeUpload={handleUpload}
              showUploadList={false}
              multiple={false}
            >
              <Button icon={<UploadOutlined />}>
                {editingBanner ? 'Thay đổi hình ảnh' : 'Chọn hình ảnh'}
              </Button>
            </Upload>
            {previewImageUrl && (
              <div style={{ marginTop: '8px' }}>
                <Image
                  width={200}
                  height={120}
                  src={previewImageUrl}
                  style={{ objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
            )}
          </Form.Item>

          <Form.Item label="Link (tùy chọn)" name="link">
            <Input placeholder="https://example.com" />
          </Form.Item>

          {userRole === 'super_admin' && (
            <Form.Item
              label="Phạm vi hiển thị"
              name="theater_id"
              rules={[{ required: true, message: 'Vui lòng chọn phạm vi!' }]}
            >
              <Select placeholder="Chọn phạm vi hiển thị">
                <Option value="global">Toàn bộ hệ thống (Global)</Option>
                {theaters.map(theater => (
                  <Option key={theater.id} value={theater.id}>
                    {theater.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item label="Trạng thái" name="is_active" valuePropName="checked">
            <Switch checkedChildren="Hoạt động" unCheckedChildren="Tạm dừng" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingBanner ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
          
        </Form>
      </Modal>
    </div>
  );
};

export default AdminAdvManagement;