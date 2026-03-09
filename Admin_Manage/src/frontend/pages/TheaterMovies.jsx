import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, DatePicker, Select, Switch, Typography, Input, Image } from 'antd';
import axios from 'axios';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const TheaterMovies = () => {
  const [movies, setMovies] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showTimeVisible, setShowTimeVisible] = useState(false);
  const [form] = Form.useForm();
  const [showTimeForm] = Form.useForm();
  const [availableMovies, setAvailableMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [alertModal, setAlertModal] = useState({ visible: false, type: '', title: '', message: '' });

  const showAlert = (type, title, message) => {
    setVisible(false);
    setShowTimeVisible(false);
    
    setTimeout(() => {
      setAlertModal({ visible: true, type, title, message });
    }, 100);
  };

  const fetchMovies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get('http://localhost:5001/api/admin/theater/movies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMovies(res.data);
    } catch (err) {
      showAlert('error', 'Lỗi', 'Lỗi khi tải danh sách phim');
      console.error('Error fetching movies:', err);
    }
  };

  const fetchAvailableMovies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get('http://localhost:5001/api/admin/theater/movies/available', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAvailableMovies(res.data);
    } catch (err) {
      showAlert('error', 'Lỗi', 'Lỗi khi tải danh sách phim có sẵn');
      console.error('Error fetching available movies:', err);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await axios.get('http://localhost:5001/api/admin/theater/movies/rooms', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      showAlert('error', 'Lỗi', 'Không thể tải danh sách phòng');
      console.error('Error fetching rooms:', err);
    }
  };

  useEffect(() => {
    fetchMovies();
    fetchAvailableMovies();
    fetchRooms();
  }, []);

  const formatStatus = (status) => {
    switch (status) {
      case 'coming_soon': return 'Sắp chiếu';
      case 'now_showing': return 'Đang chiếu';
      case 'special': return 'Đặc biệt';
      default: return `Không xác định (${status || 'undefined'})`;
    }
  };

  const formatLicenseType = (type) => {
    switch (type) {
      case 'period': return 'Theo thời hạn';
      case 'permanent': return 'Mua đứt';
      default: return type || 'Không xác định';
    }
  };

  const handleDelete = async (movieId) => {
    try {
      const token = localStorage.getItem('admin_token');
      const check = await axios.get(`http://localhost:5001/api/admin/showtimes/has-upcoming?movie_id=${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (check.data.hasUpcoming) {
        showAlert('warning', 'Không thể xóa phim', 'Phim đang có suất chiếu sắp tới tại rạp của bạn.');
        return;
      }
      
      await axios.delete(`http://localhost:5001/api/admin/theater/movies/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      showAlert('success', 'Thành công', 'Xóa phim khỏi rạp thành công!');
      fetchMovies();
    } catch (err) {
      console.error('Error deleting movie:', err.response?.data || err);
      showAlert('error', 'Lỗi xóa phim', err.response?.data?.error || 'Có lỗi xảy ra khi xóa phim');
    }
  };

  const handleSave = async (values) => {
    try {
      const movie = editMode
        ? movies.find((m) => m.movie_id === values.movie_id)
        : availableMovies.find((m) => m.id === values.movie_id);

      if (!movie) {
        showAlert('error', 'Lỗi', 'Không tìm thấy phim được chọn');
        return;
      }

      const start = values.date_range[0].startOf('day');
      const end = values.date_range[1].endOf('day');

      const licenseStart = moment(movie.license_start);
      const licenseEnd = movie.license_end ? moment(movie.license_end) : null;

      if (licenseEnd && end.isAfter(licenseEnd)) {
        showAlert('warning', 'Ngày chiếu không hợp lệ', `Ngày kết thúc chiếu vượt quá ngày hết bản quyền: ${licenseEnd.format('DD/MM/YYYY')}`);
        return;
      }

      if (movie.status !== 'special' && start.isBefore(licenseStart)) {
        showAlert('warning', 'Ngày chiếu không hợp lệ', `Ngày bắt đầu chiếu phải sau hoặc bằng ngày bản quyền: ${licenseStart.format('DD/MM/YYYY')}`);
        return;
      }

      const payload = {
        movie_id: values.movie_id,
        start_date: start.format('YYYY-MM-DD'),
        end_date: end.format('YYYY-MM-DD'),
        is_visible: values.is_visible ? 1 : 0,
      };

      const token = localStorage.getItem('admin_token');
      if (editMode) {
        await axios.put(`http://localhost:5001/api/admin/theater/movies/${values.movie_id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
       showAlert('success', 'Cập nhật thành công', `Đã cập nhật thông tin phim "${movie.title}" thành công!`);
      } else {
        await axios.post('http://localhost:5001/api/admin/theater/movies', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showAlert('success', 'Thêm phim thành công', `Phim "${movie.title}" đã được thêm vào rạp của bạn!`);
      }

      setVisible(false);
      form.resetFields();
      setSelectedMovie(null);
      setEditMode(false);
      fetchMovies();
    } catch (err) {
      console.error('Error saving movie:', err.response?.data || err);
      showAlert('error', editMode ? 'Lỗi cập nhật phim' : 'Lỗi thêm phim', err.response?.data?.error || 'Có lỗi xảy ra khi xử lý yêu cầu');
    }
  };

  const handleEdit = (record) => {
    setEditMode(true);
    setVisible(true);
    setSelectedMovie(record);
    form.setFieldsValue({
      movie_id: record.movie_id,
      date_range: [moment(record.start_date), moment(record.end_date)],
      is_visible: record.is_visible === 1,
    });
  };

  const handleCreateShowTime = async (values) => {
    try {
      const token = localStorage.getItem('admin_token');
      const showTimeValue = values.show_time;
      
      let showTime = null;
      if (showTimeValue && showTimeValue.$d) {
        showTime = moment(showTimeValue.$d).utcOffset(7).format('YYYY-MM-DD HH:mm:ss');
      } else if (moment.isMoment(showTimeValue)) {
        showTime = showTimeValue.utcOffset(7).format('YYYY-MM-DD HH:mm:ss');
      } else {
        showTime = moment(showTimeValue, 'DD/MM/YYYY HH:mm:ss').utcOffset(7).format('YYYY-MM-DD HH:mm:ss');
      }
      
      if (!showTime) {
        throw new Error('Thời gian suất chiếu không hợp lệ');
      }

      const showTimePayload = {
        movie_id: selectedMovie.movie_id,
        room_id: values.room_id,
        show_time: showTime,
      };
      
      const showTimeRes = await axios.post('http://localhost:5001/api/admin/showtimes', showTimePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const showTimeId = showTimeRes.data.id;
      if (!showTimeId) {
        throw new Error('Không nhận được ID suất chiếu từ server');
      }

      const showDate = moment(showTime);
      let ticketPrices = [];
      const isWeekend = showDate.day() === 5 || showDate.day() === 6 || showDate.day() === 0;
      const isSpecial = values.is_special;

      if (isSpecial) {
        ticketPrices = [
          { seat_type: 'vip', price: values.vip_price || 0 },
          { seat_type: 'standard', price: values.standard_price || 0 },
        ];
      } else {
        ticketPrices = [
          { seat_type: 'vip', price: isWeekend ? 100000 : 70000 },
          { seat_type: 'standard', price: isWeekend ? 80000 : 50000 },
        ];
      }

      for (const ticket of ticketPrices) {
        await axios.post('http://localhost:5001/api/admin/theater/movies/ticket-prices', {
          show_time_id: showTimeId,
          seat_type: ticket.seat_type,
          price: ticket.price,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // XỬ LÝ RESPONSE MỚI
      const { showtime, movie, nextAvailableSlots } = showTimeRes.data;
      const room = rooms.find((r) => r.id === values.room_id);
      
      let availableInfo = '';
      if (nextAvailableSlots && nextAvailableSlots.length > 0) {
        availableInfo = '\n\n💡 GIỜ KHẢ DỤNG TIẾP THEO:\n\n';
        nextAvailableSlots.forEach((slot, index) => {
          if (slot.time) {
            availableInfo += `⏰ Lựa chọn ${index + 1}:\n`;
            availableInfo += `   ${slot.time}\n`;
            availableInfo += `   ${slot.description}\n\n`;
          } else {
            availableInfo += `⚠️ ${slot.description}\n`;
          }
        });
      }
      
      showAlert(
        'success', 
        'Tạo suất chiếu thành công', 
        `Đã thêm suất chiếu cho phim "${movie}"\n\nPhòng: ${room?.room_number || 'Không xác định'}\nGiờ chiếu: ${showtime}${availableInfo}`
      );

      setShowTimeVisible(false);
      showTimeForm.resetFields();
    } catch (err) {
      console.error('=== ERROR DETAILS ===');
      console.error('Full error:', err);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
      console.error('Has suggestions?', !!err.response?.data?.suggestions);
      console.error('Has conflictWith?', !!err.response?.data?.conflictWith);
      
      if (err.response?.data?.suggestions && err.response?.data?.conflictWith) {
        const { conflictWith, suggestions } = err.response.data;
        
        console.log('Conflict with:', conflictWith);
        console.log('Suggestions array:', suggestions);
        
        let suggestionText = `⌛ Phòng đã có suất chiếu:\n"${conflictWith.movie}" lúc ${conflictWith.time}\n\n`;
        
        const validSuggestions = suggestions.filter(s => s.time !== null);
        
        if (validSuggestions.length > 0) {
          suggestionText += '💡 THỜI GIAN KHẢ DỤNG:\n\n';
          validSuggestions.forEach((s, index) => {
            suggestionText += `⏰ Lựa chọn ${index + 1}:\n`;
            suggestionText += `   ${s.time}\n`;
            suggestionText += `   ${s.description}\n\n`;
          });
          suggestionText += '👉 Vui lòng chọn một trong các thời gian trên';
        } else {
          suggestionText += '⚠️ ' + (suggestions[0]?.description || 'Không có thời gian khả dụng trong ngày này');
        }
        
        showAlert('warning', '⚠️ Lịch chiếu bị trùng', suggestionText);
      } else {
        let errorMessage = 'Có lỗi xảy ra khi tạo suất chiếu';
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.log('Showing normal error:', errorMessage);
        showAlert('error', 'Lỗi tạo suất chiếu', errorMessage);
      }
    }
  };

  const handleDateChange = (dates) => {
    if (!selectedMovie || !dates || dates.length < 2) return;

    const [start, end] = dates;
    const licenseStart = moment(selectedMovie.license_start);
    const licenseEnd = selectedMovie.license_end ? moment(selectedMovie.license_end) : null;

    if (start && licenseStart && start.isBefore(licenseStart)) {
      showAlert('warning', 'Cảnh báo ngày chiếu', `📆 Ngày bắt đầu (${start.format('DD/MM/YYYY')}) sớm hơn ngày bản quyền: ${licenseStart.format('DD/MM/YYYY')}`);
    }

    if (licenseEnd && end && end.isAfter(licenseEnd)) {
      showAlert('warning', 'Cảnh báo ngày chiếu', `📆 Ngày kết thúc (${end.format('DD/MM/YYYY')}) muộn hơn ngày bản quyền: ${licenseEnd.format('DD/MM/YYYY')}`);
    }
  };

  const columns = [
    {
      title: 'Poster',
      dataIndex: 'poster',
      width: 100,
      render: (poster) => (
        <Image
          src={poster}
          alt="movie poster"
          width={60}
          height={90}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          preview={true}
        />
      ),
    },
    { title: 'Tên phim', dataIndex: 'title' },
    { title: 'Thể loại', dataIndex: 'genre' },
    { title: 'Thời lượng', dataIndex: 'duration', render: (d) => `${d} phút` },
    { title: 'Ngày chiếu', dataIndex: 'start_date', render: (date) => moment(date).format('DD/MM/YYYY') },
    { title: 'Ngày kết thúc', dataIndex: 'end_date', render: (date) => moment(date).format('DD/MM/YYYY') },
    { title: 'Ẩn/Hiện', dataIndex: 'is_visible', render: (v) => (v ? 'Hiện' : 'Ẩn') },
    {
      title: 'Hành động',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>Sửa</Button>
          <Button danger onClick={() => handleDelete(record.movie_id)}>Xóa</Button>
          <Button type="primary" onClick={() => { setSelectedMovie(record); setShowTimeVisible(true); }}>Tạo Suất Chiếu</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Modal
        open={alertModal.visible}
        onOk={() => setAlertModal({ ...alertModal, visible: false })}
        onCancel={() => setAlertModal({ ...alertModal, visible: false })}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => setAlertModal({ ...alertModal, visible: false })}
            className={
              alertModal.type === 'success' ? 'bg-green-500 hover:bg-green-600' :
              alertModal.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' :
              'bg-red-500 hover:bg-red-600'
            }
          >
            Đóng
          </Button>
        ]}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {alertModal.type === 'success' && (
            <div style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }}>✓</div>
          )}
          {alertModal.type === 'warning' && (
            <div style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }}>⚠</div>
          )}
          {alertModal.type === 'error' && (
            <div style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }}>✕</div>
          )}
          
          <h3 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            marginBottom: '12px',
            color: alertModal.type === 'success' ? '#52c41a' :
                   alertModal.type === 'warning' ? '#faad14' : '#ff4d4f'
          }}>
            {alertModal.title}
          </h3>
          
          <p style={{ 
            fontSize: '14px', 
            color: '#666', 
            whiteSpace: 'pre-line',
            lineHeight: '1.6'
          }}>
            {alertModal.message}
          </p>
        </div>
      </Modal>

      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🎬 Quản lý phim tại rạp của bạn</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => { setEditMode(false); setVisible(true); }}
          className="mb-4"
        >
          Thêm phim từ danh sách có sẵn
        </Button>
        
        <Table
          rowKey="movie_id"
          columns={columns}
          dataSource={movies}
          className="bg-white rounded-lg shadow-md"
          pagination={{ pageSize: 10 }}
        />

        <Modal
          title={editMode ? 'Chỉnh sửa thông tin phim' : 'Thêm phim có sẵn'}
          open={visible}
          onCancel={() => {
            setVisible(false);
            form.resetFields();
            setSelectedMovie(null);
            setEditMode(false);
          }}
          onOk={() => form.submit()}
          width={700}
        >
          <Form layout="vertical" form={form} onFinish={handleSave}>
            <Form.Item name="movie_id" label="Chọn phim" rules={[{ required: true, message: 'Vui lòng chọn phim' }]}>
              <Select
                placeholder="Chọn phim có sẵn"
                showSearch
                optionFilterProp="children"
                onChange={(id) => setSelectedMovie(editMode ? movies.find(m => m.movie_id === id) : availableMovies.find(m => m.id === id))}
                disabled={editMode}
              >
                {(editMode ? movies : availableMovies).map((movie) => (
                  <Option key={movie.id || movie.movie_id} value={movie.id || movie.movie_id}>
                    <div style={{ display: 'flex', alignItems: 'center', padding: '8px 0' }}>
                      <img 
                        src={movie.poster} 
                        alt={movie.title} 
                        style={{ 
                          width: '50px', 
                          height: '75px', 
                          objectFit: 'cover', 
                          borderRadius: '4px',
                          marginRight: '12px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{movie.title}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {movie.genre} • {movie.duration} phút
                        </div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          Trạng thái: {formatStatus(movie.status)}
                        </Text>
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedMovie && (
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <Text strong className="block">Trạng thái phim:</Text> {formatStatus(selectedMovie.status)}<br />
                <Text strong className="block">Loại bản quyền:</Text> {formatLicenseType(selectedMovie.license_type)}<br />
                <Text strong className="block">Bản quyền:</Text> 
                {selectedMovie.license_end ? (
                  <>
                    {moment(selectedMovie.license_start).format('DD/MM/YYYY')} → {moment(selectedMovie.license_end).format('DD/MM/YYYY')}
                    <br />
                    <Text strong className="block">Còn lại:</Text> {
                      Math.max(0, Math.ceil((moment(selectedMovie.license_end).diff(moment(), 'days'))))
                    } ngày
                  </>
                ) : (
                  <>
                    Từ {moment(selectedMovie.license_start).format('DD/MM/YYYY')} (Mua đứt - Vô thời hạn)
                    <br />
                    <Text strong className="block" style={{ color: '#52c41a' }}>Bản quyền vĩnh viễn ✓</Text>
                  </>
                )}
              </div>
            )}

            <Form.Item name="date_range" label="Ngày chiếu" rules={[{ required: true, message: 'Vui lòng chọn khoảng ngày chiếu' }]}>
              <RangePicker
                format="DD/MM/YYYY"
                onChange={handleDateChange}
                disabledDate={(current) => {
                  if (!selectedMovie) return false;
                  const licenseStart = moment(selectedMovie.license_start).startOf('day');
                  
                  if (!selectedMovie.license_end) {
                    return current && current.isBefore(licenseStart);
                  }
                  
                  const licenseEnd = moment(selectedMovie.license_end).subtract(1, 'day').endOf('day');
                  return current && (current.isBefore(licenseStart) || current.isAfter(licenseEnd));
                }}
                className="w-full"
              />
            </Form.Item>

            <Form.Item name="is_visible" label="Hiển thị" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Tạo Suất Chiếu"
          open={showTimeVisible}
          onCancel={() => { setShowTimeVisible(false); showTimeForm.resetFields(); }}
          onOk={() => showTimeForm.submit()}
        >
          <Form layout="vertical" form={showTimeForm} onFinish={handleCreateShowTime}>
            <Text strong className="block">Phim: {selectedMovie?.title || 'Chưa chọn phim'}</Text>
            <Form.Item name="room_id" label="Chọn phòng" rules={[{ required: true, message: 'Vui lòng chọn phòng' }]}>
              <Select placeholder="Chọn phòng">
                {rooms.map((room) => (
                  <Option key={room.id} value={room.id}>{`Phòng ${room.room_number} (Dung lượng: ${room.capacity})`}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="show_time" label="Thời gian suất chiếu" rules={[{ required: true, message: 'Vui lòng chọn thời gian' }]}>
              <DatePicker
                showTime={{ format: 'HH:mm:ss', defaultValue: moment('12:00:00', 'HH:mm:ss') }}
                format="DD/MM/YYYY HH:mm:ss"
                className="w-full"
              />
            </Form.Item>
            <Form.Item name="is_special" label="Suất đặc biệt" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.is_special !== curr.is_special}>
              {({ getFieldValue }) => {
                const isSpecial = getFieldValue('is_special');
                return isSpecial ? (
                  <>
                    <Form.Item name="vip_price" label="Giá vé VIP (đ)" rules={[{ required: true, message: 'Vui lòng nhập giá vé VIP' }]}>
                      <Input type="number" addonAfter="đ" />
                    </Form.Item>
                    <Form.Item name="standard_price" label="Giá vé Standard (đ)" rules={[{ required: true, message: 'Vui lòng nhập giá vé Standard' }]}>
                      <Input type="number" addonAfter="đ" />
                    </Form.Item>
                  </>
                ) : null;
              }}
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default TheaterMovies;