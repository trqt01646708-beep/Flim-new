import React, { useState, useEffect } from 'react';
import {
  Table, Button, Modal, Form, Upload, Switch, Select, 
  message, Popconfirm, Space, Image, Tag, Row, Col
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, 
  UploadOutlined, DollarOutlined 
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const AdminTicketPriceManagement = () => {
  const [banners, setBanners] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [form] = Form.useForm();
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // Lấy thông tin admin từ localStorage
  const adminData = JSON.parse(localStorage.getItem('admin_info') || '{}');
  const authToken = localStorage.getItem('admin_token');
  const userRole = adminData.role;

  useEffect(() => {
    fetchTicketPriceBanners();
    if (userRole === 'super_admin') {
      fetchTheaters();
    }
  }, []);

  const fetchTicketPriceBanners = async () => {
    setLoading(true);
    try {
      // SỬA: Thêm /api prefix vào URL
      const response = await axios.get('http://localhost:5001/api/admin/adv/ticket-price-banners', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setBanners(response.data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách banner giá vé');
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
        formData.append('ticket_price_banner', uploadedImage);
        // SỬA: Thêm /api prefix vào URL
        const uploadResponse = await axios.post(
          'http://localhost:5001/api/admin/adv/ticket-price-banners/upload',
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
        // SỬA: Thêm /api prefix vào URL
        await axios.put(
          `http://localhost:5001/api/admin/adv/ticket-price-banners/${editingBanner.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Cập nhật banner giá vé thành công');
      } else {
        // SỬA: Thêm /api prefix vào URL
        await axios.post(
          'http://localhost:5001/api/admin/adv/ticket-price-banners',
          submitData,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        message.success('Thêm banner giá vé thành công');
      }

      setModalVisible(false);
      resetForm();
      await fetchTicketPriceBanners();
    } catch (error) {
      message.error(editingBanner ? 'Lỗi cập nhật banner giá vé' : 'Lỗi thêm banner giá vé');
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
      // SỬA: Thêm /api prefix vào URL
      await axios.delete(`http://localhost:5001/api/admin/adv/ticket-price-banners/${bannerId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      message.success('Xóa banner giá vé thành công');
      await fetchTicketPriceBanners();
    } catch (error) {
      message.error('Lỗi xóa banner giá vé');
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
      title: 'Rạp',
      dataIndex: 'theater_name',
      key: 'theater_name',
      render: (theaterName) => (
        <Tag color="blue">{theaterName}</Tag>
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
            title="Bạn có chắc muốn xóa banner giá vé này?"
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
          <h2><DollarOutlined /> Quản lý Banner Giá Vé</h2>
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
            Thêm Banner Giá Vé
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
        title={editingBanner ? 'Sửa Banner Giá Vé' : 'Thêm Banner Giá Vé'}
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
            theater_id: userRole === 'theater_admin' ? adminData.assigned_theater_id : undefined
          }}
        >
          <Form.Item 
            label="Hình ảnh bảng giá"
            name="image_path"
            rules={[{
              required: !editingBanner || uploadedImage,
              message: 'Vui lòng chọn hình ảnh bảng giá!'
            }]}
          >
            <Upload
              accept="image/*"
              beforeUpload={handleUpload}
              showUploadList={false}
              multiple={false}
            >
              <Button icon={<UploadOutlined />}>
                {editingBanner ? 'Thay đổi hình ảnh' : 'Chọn hình ảnh bảng giá'}
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

          {userRole === 'super_admin' && (
            <Form.Item
              label="Rạp"
              name="theater_id"
              rules={[{ required: true, message: 'Vui lòng chọn rạp!' }]}
            >
              <Select placeholder="Chọn rạp">
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

export default AdminTicketPriceManagement;