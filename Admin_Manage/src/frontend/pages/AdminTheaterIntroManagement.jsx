import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Upload, Switch, Select, 
  message, Popconfirm, Space, Image, Tag, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, PictureOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const AdminTheaterIntroManagement = () => {
  const [banners, setBanners] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  const adminData = JSON.parse(localStorage.getItem('admin_info') || '{}');
  const authToken = localStorage.getItem('admin_token');
  const userRole = adminData.role;

  useEffect(() => {
    fetchTheaterIntroBanners();
    if (userRole === 'super_admin') {
      fetchTheaters();
    }
  }, []);

  const fetchTheaterIntroBanners = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/admin/theater-intro-banners', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBanners(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách banner giới thiệu rạp');
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
    const previewUrl = URL.createObjectURL(file);
    setUploadedImage(file);
    setPreviewImageUrl(previewUrl);
    form.setFieldsValue({ image_path: 'temp' });
    message.success('Đã chọn ảnh, nhấn Thêm để lưu');
    return false;
  };

  const handleSubmit = async (values) => {
    try {
      let imagePath = editingBanner ? editingBanner.image_url : null;
      
      if (uploadedImage) {
        const formData = new FormData();
        formData.append('theater_intro_banner', uploadedImage);
        
        const uploadResponse = await axios.post(
          'http://localhost:5001/api/admin/theater-intro-banners/upload',
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
          `http://localhost:5001/api/admin/theater-intro-banners/${editingBanner.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Cập nhật banner giới thiệu rạp thành công');
      } else {
        await axios.post(
          'http://localhost:5001/api/admin/theater-intro-banners',
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Thêm banner giới thiệu rạp thành công');
      }

      setModalVisible(false);
      resetForm();
      await fetchTheaterIntroBanners();
    } catch (error) {
      message.error(editingBanner ? 'Lỗi cập nhật banner' : 'Lỗi thêm banner');
      console.error(error);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setPreviewImageUrl(banner.image_url);
    setUploadedImage(null);
    form.setFieldsValue({
      is_active: banner.is_active,
      theater_id: banner.theater_id,
      image_path: banner.image_url
    });
    setModalVisible(true);
  };

  const handleDelete = async (bannerId) => {
    try {
      await axios.delete(`http://localhost:5001/api/admin/theater-intro-banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      message.success('Xóa banner giới thiệu rạp thành công');
      await fetchTheaterIntroBanners();
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
      width: 150,
      render: (url) => (
        <Image
          width={130}
          height={80}
          src={url}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          fallback="/placeholder-image.jpg"
        />
      )
    },
    {
      title: 'Rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
      render: (theaterName) => (
        <Tag color="blue" icon={<PictureOutlined />}>
          {theaterName}
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
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 200,
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
          <h2>
            <PictureOutlined style={{ marginRight: '8px' }} />
            Quản lý Banner Giới Thiệu Rạp
          </h2>
          <p style={{ color: '#64748b', marginTop: '4px' }}>
            Banner này sẽ hiển thị ở trang chi tiết rạp phim
          </p>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => {
              resetForm();
              setModalVisible(true);
            }}
          >
            Thêm Banner Giới Thiệu
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
          showTotal: (total) => `Tổng ${total} banner`,
        }}
        scroll={{ x: 900 }}
        locale={{
          emptyText: 'Chưa có banner giới thiệu nào'
        }}
      />

      <Modal
        title={
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            <PictureOutlined style={{ marginRight: '8px', color: '#3b82f6' }} />
            {editingBanner ? 'Sửa Banner Giới Thiệu Rạp' : 'Thêm Banner Giới Thiệu Rạp'}
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          resetForm();
        }}
        footer={null}
        width={650}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            is_active: true,
            theater_id: userRole === 'theater_admin' ? adminData.assigned_theater_id : undefined
          }}
        >
          <Form.Item 
            label={
              <span style={{ fontWeight: '600' }}>
                Hình ảnh giới thiệu rạp
                <span style={{ color: '#64748b', fontWeight: '400', marginLeft: '8px' }}>
                  (Khuyến nghị: 1400x400px)
                </span>
              </span>
            }
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
              <Button icon={<UploadOutlined />} size="large">
                {editingBanner ? 'Thay đổi hình ảnh' : 'Chọn hình ảnh'}
              </Button>
            </Upload>
            {previewImageUrl && (
              <div style={{ marginTop: '16px' }}>
                <Image
                  width="100%"
                  height={200}
                  src={previewImageUrl}
                  style={{ objectFit: 'cover', borderRadius: '8px', border: '2px solid #e5e7eb' }}
                />
              </div>
            )}
          </Form.Item>

          {userRole === 'super_admin' && (
            <Form.Item
              label={<span style={{ fontWeight: '600' }}>Rạp</span>}
              name="theater_id"
              rules={[{ required: true, message: 'Vui lòng chọn rạp!' }]}
            >
              <Select 
                placeholder="Chọn rạp" 
                size="large"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {theaters.map(theater => (
                  <Option key={theater.id} value={theater.id}>
                    {theater.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item 
            label={<span style={{ fontWeight: '600' }}>Trạng thái</span>}
            name="is_active" 
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Hoạt động" 
              unCheckedChildren="Tạm dừng"
              size="default"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space size="middle">
              <Button 
                type="primary" 
                htmlType="submit"
                size="large"
                icon={editingBanner ? <EditOutlined /> : <PlusOutlined />}
              >
                {editingBanner ? 'Cập nhật' : 'Thêm Banner'}
              </Button>
              <Button
                size="large"
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

export default AdminTheaterIntroManagement;