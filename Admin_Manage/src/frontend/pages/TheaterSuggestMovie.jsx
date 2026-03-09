import React, { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Upload, Image } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Option } = Select;

const TheaterSuggestMovie = () => {
  const [form] = Form.useForm();
  const [licenseType, setLicenseType] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Upload poster
  const handleUploadPoster = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ chấp nhận file ảnh!');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('Ảnh phải nhỏ hơn 10MB!');
      return false;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('poster', file);

    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(
        'http://localhost:5001/api/admin/suggestions/upload-poster',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.poster_url) {
        setPosterUrl(response.data.poster_url);
        message.success('Upload poster thành công');
      }
    } catch (error) {
      console.error('Lỗi upload:', error);
      message.error(error.response?.data?.error || 'Lỗi upload poster');
    } finally {
      setUploading(false);
    }

    return false;
  };

  const handleRemovePoster = () => {
    setPosterUrl('');
    message.info('Đã xóa poster');
  };

  const onFinish = async (values) => {
    if (!posterUrl) {
      message.error('Vui lòng upload poster trước khi gửi');
      return;
    }

    // Validate dates for temporary license
    if (values.license_type === 'temporary') {
      if (!values.license_start || !values.license_end) {
        message.error('Bản quyền tạm thời cần có ngày bắt đầu và kết thúc');
        return;
      }
      if (new Date(values.license_end) <= new Date(values.license_start)) {
        message.error('Ngày kết thúc phải sau ngày bắt đầu');
        return;
      }
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const payload = {
        title: values.title,
        genre: values.genre,
        duration: parseInt(values.duration),
        description: values.description,
        director: values.director,
        main_actors: values.main_actors,
        language: values.language,
        release_date: values.release_date,
        poster: posterUrl,
        license_type: values.license_type,
        license_start: values.license_start || null,
        license_end: values.license_type === 'temporary' ? values.license_end : null,
      };

      await axios.post('http://localhost:5001/api/admin/suggestions', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      message.success('Gửi đề xuất phim thành công');
      form.resetFields();
      setPosterUrl('');
      setLicenseType('');
    } catch (err) {
      console.error('Error:', err);
      message.error(err.response?.data?.error || 'Lỗi gửi đề xuất');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title="🎬 Gửi đề xuất phim mới" 
        style={{ maxWidth: 900, margin: '0 auto' }}
      >
        <p style={{ color: '#666', marginBottom: '24px' }}>
          Điền đầy đủ thông tin phim bạn muốn đề xuất
        </p>

        <Form layout="vertical" form={form} onFinish={onFinish}>
          {/* TÊN PHIM */}
          <Form.Item 
            name="title" 
            label="Tên phim" 
            rules={[{ required: true, message: 'Vui lòng nhập tên phim' }]}
          >
            <Input placeholder="VD: Avengers: Endgame" size="large" />
          </Form.Item>

          {/* UPLOAD POSTER */}
          <Form.Item label="Poster phim" required>
            {!posterUrl ? (
              <Upload
                beforeUpload={handleUploadPoster}
                showUploadList={false}
                accept="image/*"
                disabled={uploading}
              >
                <Button
                  icon={<UploadOutlined />}
                  loading={uploading}
                  size="large"
                  block
                  type="dashed"
                  style={{ height: '100px' }}
                >
                  {uploading ? 'Đang upload...' : 'Click để upload poster'}
                </Button>
              </Upload>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <Image
                  src={posterUrl}
                  alt="Poster"
                  style={{ maxWidth: '250px', maxHeight: '350px', borderRadius: '8px' }}
                />
                <div style={{ marginTop: '12px' }}>
                  <Button danger icon={<DeleteOutlined />} onClick={handleRemovePoster}>
                    Xóa và upload lại
                  </Button>
                </div>
              </div>
            )}
          </Form.Item>

          {/* THỂ LOẠI */}
          <Form.Item 
            name="genre" 
            label="Thể loại" 
            rules={[{ required: true, message: 'Vui lòng nhập thể loại' }]}
          >
            <Input placeholder="VD: Hành động, Kinh dị" size="large" />
          </Form.Item>

          {/* THỜI LƯỢNG */}
          <Form.Item 
            name="duration" 
            label="Thời lượng (phút)" 
            rules={[{ required: true, message: 'Vui lòng nhập thời lượng' }]}
          >
            <Input type="number" placeholder="VD: 120" size="large" min={1} max={500} />
          </Form.Item>

          {/* ĐẠO DIỄN */}
          <Form.Item 
            name="director" 
            label="Đạo diễn" 
            rules={[{ required: true, message: 'Vui lòng nhập đạo diễn' }]}
          >
            <Input placeholder="VD: Christopher Nolan" size="large" />
          </Form.Item>

          {/* DIỄN VIÊN */}
          <Form.Item 
            name="main_actors" 
            label="Diễn viên chính" 
            rules={[{ required: true, message: 'Vui lòng nhập diễn viên' }]}
          >
            <Input placeholder="VD: Robert Downey Jr., Chris Evans" size="large" />
          </Form.Item>

          {/* NGÔN NGỮ */}
          <Form.Item 
            name="language" 
            label="Ngôn ngữ" 
            rules={[{ required: true, message: 'Vui lòng nhập ngôn ngữ' }]}
          >
            <Input placeholder="VD: Tiếng Anh" size="large" />
          </Form.Item>

          {/* NGÀY KHỞI CHIẾU */}
          <Form.Item 
            name="release_date" 
            label="Ngày khởi chiếu" 
            rules={[{ required: true, message: 'Vui lòng chọn ngày khởi chiếu' }]}
          >
            <Input type="date" size="large" />
          </Form.Item>

          {/* MÔ TẢ */}
          <Form.Item 
            name="description" 
            label="Mô tả" 
            rules={[{ required: true, message: 'Vui lòng nhập mô tả' }]}
          >
            <TextArea rows={5} placeholder="Mô tả nội dung phim..." showCount maxLength={2000} />
          </Form.Item>

          {/* LOẠI BẢN QUYỀN */}
          <Form.Item 
            name="license_type" 
            label="Loại bản quyền" 
            rules={[{ required: true, message: 'Vui lòng chọn loại bản quyền' }]}
          >
            <Select
              placeholder="Chọn loại bản quyền"
              size="large"
              onChange={(value) => {
                setLicenseType(value);
                form.setFieldsValue({ license_start: undefined, license_end: undefined });
              }}
            >
              <Option value="permanent">Mua đứt (vĩnh viễn)</Option>
              <Option value="temporary">Tạm thời (có thời hạn)</Option>
            </Select>
          </Form.Item>

          {/* NGÀY BẮT ĐẦU BẢN QUYỀN */}
          {licenseType !== '' && (
            <Form.Item
              name="license_start"
              label="Ngày bắt đầu bản quyền"
              rules={[
                {
                  required: licenseType === 'temporary',
                  message: 'Bản quyền tạm thời cần ngày bắt đầu',
                },
              ]}
            >
              <Input type="date" size="large" />
            </Form.Item>
          )}

          {/* NGÀY KẾT THÚC BẢN QUYỀN */}
          {licenseType === 'temporary' && (
            <Form.Item
              name="license_end"
              label="Ngày kết thúc bản quyền"
              rules={[{ required: true, message: 'Cần ngày kết thúc' }]}
            >
              <Input type="date" size="large" />
            </Form.Item>
          )}

          {/* SUBMIT */}
          <Form.Item style={{ marginTop: '32px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              size="large"
              loading={loading}
              disabled={!posterUrl || uploading}
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TheaterSuggestMovie;