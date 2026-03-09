import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Table, Button, Popconfirm, message, Modal, Form, Input, Select, DatePicker, Upload, Image
} from 'antd';
import { UploadOutlined, PlusOutlined, LoadingOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const AdminMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form] = Form.useForm();
  const [editingMovie, setEditingMovie] = useState(null);
  
  // States cho upload ảnh
  const [posterUrl, setPosterUrl] = useState('');
  const [posterPath, setPosterPath] = useState('');
  const [uploading, setUploading] = useState(false);

  const token = localStorage.getItem('admin_token');

  const fetchMovies = async () => {
    setLoading(true);
    try {
      console.log('Token:', token);
      const res = await axios.get('http://localhost:5001/api/admin/movies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('API Response:', res.data);
      setMovies(res.data);
    } catch (err) {
      console.error('Error fetching movies:', err.response?.data || err.message);
      message.error('Lỗi khi tải danh sách phim: ' + (err.response?.data?.error || err.message));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Xử lý upload ảnh
  const handleUpload = async (file) => {
    console.log('Bắt đầu upload file:', file.name);
    
    // Kiểm tra nếu đang upload thì không cho upload tiếp
    if (uploading) {
      message.warning('Đang upload ảnh, vui lòng đợi...');
      return false;
    }
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('poster', file);

    try {
      const res = await axios.post('http://localhost:5001/api/admin/movies/upload-poster', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Upload response:', res.data);
      
      // Lưu URL để hiển thị và path để gửi về server
      setPosterUrl(res.data.poster_url);
      setPosterPath(res.data.path);
      
      // Set vào form
      form.setFieldsValue({ poster_path: res.data.path });
      
      message.success('Upload poster thành công!');
    } catch (err) {
      console.error('Upload error:', err);
      message.error('Lỗi upload poster: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
    
    return false; // Prevent default upload behavior
  };

  // Reset upload states
  const resetUploadStates = () => {
    setPosterUrl('');
    setPosterPath('');
    setUploading(false);
  };

  // Xóa ảnh đã upload
  const handleRemovePoster = () => {
    setPosterUrl('');
    setPosterPath('');
    form.setFieldsValue({ poster_path: '' });
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`http://localhost:5001/api/admin/movies/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success(res.data.message);
      fetchMovies();
    } catch (err) {
      console.error('Delete Error:', err.response?.data || err.message);
      message.error(`Lỗi khi xoá: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEdit = (movie) => {
    setEditingMovie(movie);
    setShowModal(true);
    
    console.log('Editing movie data:', movie);
    
    // Set poster hiện tại nếu có
    if (movie.poster) {
      setPosterUrl(movie.poster);
      // Extract path từ full URL nếu cần
      const pathMatch = movie.poster.match(/\/uploads\/movies\/.+$/);
      setPosterPath(pathMatch ? pathMatch[0] : '');
    } else {
      // Reset poster states nếu không có poster
      setPosterUrl('');
      setPosterPath('');
    }
    
    // Kiểm tra và xử lý giá trị ngày
    const safeParseDate = (date) => {
      try {
        if (!date) return null;
        const d = dayjs(date);
        return d.isValid() ? d : null;
      } catch {
        return null;
      }
    };

    // Set tất cả giá trị vào form
    form.setFieldsValue({
      title: movie.title || '',
      genre: movie.genre || '',
      poster_path: (movie.poster && movie.poster.match(/\/uploads\/movies\/.+$/)) ? movie.poster.match(/\/uploads\/movies\/.+$/)[0] : '',
      duration: movie.duration || '',
      description: movie.description || '',
      director: movie.director || '',
      main_actors: movie.main_actors || '',
      language: movie.language || 'Tiếng Việt',
      start_date: safeParseDate(movie.start_date),
      end_date: safeParseDate(movie.end_date),
      status: movie.status || '',
      license_type: movie.license_type || '',
      license_start: safeParseDate(movie.license_start),
      license_end: safeParseDate(movie.license_end),
      is_visible: movie.is_visible !== undefined ? movie.is_visible : 1
    });
    
    console.log('Form values set:', form.getFieldsValue());
  };

  const handleFinish = async (values) => {
    console.log('Form values:', values);
    
    const today = dayjs();
    const start = values.start_date;
    const body = {
      ...values,
      start_date: start ? start.format('YYYY-MM-DD') : null,
      end_date: values.end_date ? values.end_date.format('YYYY-MM-DD') : null,
    };

    // Nếu chưa có status thì tự tính
    if (!body.status || body.status.trim() === '') {
      if (start && start.isBefore(today.add(1, 'day'), 'day')) {
        body.status = 'now_showing';
      } else {
        body.status = 'coming_soon';
      }
    }

    try {
      if (editingMovie) {
        await axios.put(`http://localhost:5001/api/admin/movies/${editingMovie.id}`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Cập nhật thành công');
      } else {
        await axios.post(`http://localhost:5001/api/admin/movies`, body, {
          headers: { Authorization: `Bearer ${token}` },
        });
        message.success('Thêm phim thành công');
      }
      
      setShowModal(false);
      setEditingMovie(null);
      form.resetFields();
      resetUploadStates();
      fetchMovies();
    } catch (err) {
      console.error('Save error:', err);
      message.error(err.response?.data?.error || 'Lỗi xử lý');
    }
  };

  // Upload button component
  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>
        {uploading ? 'Đang upload...' : 'Upload Poster'}
      </div>
    </div>
  );

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'poster',
      render: (url) => (
        <Image 
          src={url} 
          alt="poster" 
          width={60} 
          height={90}
          style={{ objectFit: 'cover' }}
        />
      ),
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
    },
    {
      title: 'Thể loại',
      dataIndex: 'genre',
    },
    {
      title: 'Thời lượng',
      dataIndex: 'duration',
      render: (duration) => `${duration} phút`,
    },
    {
      title: 'Ngày chiếu',
      dataIndex: 'start_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'end_date',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_visible',
      render: (val) => (val ? 'Hiển thị' : 'Ẩn'),
    },
    {
      title: 'License',
      dataIndex: 'license_type',
      render: (val, row) =>
        val === 'permanent' ? 'Mua đứt' : `${dayjs(row.license_start).format('DD/MM/YYYY')} → ${dayjs(row.license_end).format('DD/MM/YYYY')}`,  
    },
    {
      title: 'Hành động',
      render: (text, record) => (
        <>
          <Button type="link" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Popconfirm title="Xác nhận xoá?" onConfirm={() => handleDelete(record.id)}>
            <Button danger type="link">Xoá</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div>
      <h2>🎬 Quản lý phim (Super Admin)</h2>
      <Button 
        type="primary" 
        icon={<PlusOutlined />} 
        onClick={() => {
          setShowModal(true);
          resetUploadStates();
        }}
      >
        Thêm phim
      </Button>
      
      {movies.length === 0 && !loading && <p>Không có phim nào để hiển thị.</p>}
      
      <Table
        rowKey="id"
        columns={columns}
        dataSource={movies}
        loading={loading}
        style={{ marginTop: 20 }}
        scroll={{ x: 1200 }}
      />

      <Modal
        open={showModal}
        title={editingMovie ? 'Cập nhật phim' : 'Thêm phim'}
        onCancel={() => {
          setShowModal(false);
          setEditingMovie(null);
          form.resetFields();
          resetUploadStates();
        }}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Nhập tiêu đề phim" />
          </Form.Item>
          
          <Form.Item name="genre" label="Thể loại" rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: Hành động, Hài, Kinh dị" />
          </Form.Item>

          {/* POSTER UPLOAD FIELD */}
          <Form.Item 
            name="poster_path" 
            label="Poster phim" 
            rules={[{ required: true, message: 'Vui lòng upload poster' }]}
          >
            <div>
              <Upload
                name="poster"
                listType="picture-card"
                className="poster-uploader"
                showUploadList={false}
                beforeUpload={handleUpload}
                accept="image/*"
                disabled={uploading}
              >
                {posterUrl ? (
                  <img 
                    src={posterUrl} 
                    alt="poster" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
              
              {posterUrl && (
                <div style={{ marginTop: 8, textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    icon={<DeleteOutlined />}
                    onClick={handleRemovePoster}
                    danger
                  >
                    Xóa ảnh
                  </Button>
                </div>
              )}
              
              <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                Chấp nhận: JPG, PNG, WEBP, GIF. Tối đa 10MB
              </div>
            </div>
          </Form.Item>

          <Form.Item name="duration" label="Thời lượng (phút)" rules={[{ required: true }]}>
            <Input type="number" min={1} max={500} placeholder="Ví dụ: 120" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Mô tả nội dung phim" />
          </Form.Item>

          <Form.Item name="director" label="Đạo diễn" rules={[{ required: true }]}>
            <Input placeholder="Tên đạo diễn" />
          </Form.Item>

          <Form.Item name="main_actors" label="Diễn viên chính" rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Các diễn viên chính, cách nhau bằng dấu phẩy" />
          </Form.Item>

          <Form.Item name="language" label="Ngôn ngữ" rules={[{ required: true }]}>
            <Select placeholder="Chọn ngôn ngữ">
              <Option value="Tiếng Việt">Tiếng Việt</Option>
              <Option value="Tiếng Anh">Tiếng Anh</Option>
              <Option value="Tiếng Hàn">Tiếng Hàn</Option>
              <Option value="Tiếng Nhật">Tiếng Nhật</Option>
              <Option value="Tiếng Trung">Tiếng Trung</Option>
              <Option value="Tiếng Pháp">Tiếng Pháp</Option>
              <Option value="Khác">Khác</Option>
            </Select>
          </Form.Item>

          <Form.Item name="start_date" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="end_date" label="Ngày kết thúc" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item name="status" label="Trạng thái phim">
            <Select allowClear placeholder="Chọn hoặc để trống để tự động xác định">
              <Option value="now_showing">Đang chiếu</Option>
              <Option value="coming_soon">Sắp chiếu</Option>
              <Option value="special">Chiếu đặc biệt</Option>
            </Select>
          </Form.Item>

          <Form.Item name="license_type" label="Bản quyền" rules={[{ required: true }]}>
            <Select placeholder="Chọn loại bản quyền">
              <Option value="period">Có thời hạn</Option>
              <Option value="permanent">Mua đứt</Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="license_start" 
            label="Từ ngày" 
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item 
            noStyle 
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.license_type !== currentValues.license_type
            }
          >
            {({ getFieldValue }) => {
              const licenseType = getFieldValue('license_type');
              return licenseType === 'period' ? (
                <Form.Item 
                  name="license_end" 
                  label="Đến ngày" 
                  rules={[{ required: true, message: 'Vui lòng chọn ngày hết hạn cho bản quyền có thời hạn' }]}
                >
                  <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              ) : (
                <Form.Item name="license_end" style={{ display: 'none' }}>
                  <Input style={{ display: 'none' }} />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="is_visible" label="Hiển thị" rules={[{ required: true }]}>
            <Select placeholder="Chọn trạng thái hiển thị">
              <Option value={1}>Hiển thị</Option>
              <Option value={0}>Ẩn</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>


    </div>
  );
};

export default AdminMovies;