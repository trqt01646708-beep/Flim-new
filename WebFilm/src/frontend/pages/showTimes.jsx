import React, { useEffect, useState } from 'react';
import { Card, DatePicker, Select, Row, Col, message, Button } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

dayjs.locale('vi');
const { Option } = Select;

const ShowTimes = () => {
  const [movie, setMovie] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showtimes, setShowtimes] = useState([]);
  const { movieId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Nhận pre-selected values từ Home
  const { preSelectedTheater, preSelectedDate } = location.state || {};

  const handleTheaterChange = (value) => {
    setSelectedTheater(value);
    setShowtimes([]);
  };

  useEffect(() => {
    axios.get(`http://localhost:5000/api/films/${movieId}`)
      .then(res => setMovie(res.data))
      .catch(() => message.error("Không tải được thông tin phim"));

    axios.get(`http://localhost:5000/api/showtimes/theaters/by-movie/${movieId}`)
      .then(res => {
        setTheaters(res.data);
        
        // Tự động chọn rạp nếu có preSelectedTheater
        if (preSelectedTheater && res.data.find(t => t.id === preSelectedTheater)) {
          setSelectedTheater(preSelectedTheater);
        }
      })
      .catch(() => message.error("Không tải được rạp"));

    const dateRange = [];
    for (let i = 0; i < 7; i++) {
      dateRange.push(dayjs().add(i, 'day'));
    }
    setDates(dateRange);
    
    // Tự động chọn ngày nếu có preSelectedDate
    if (preSelectedDate) {
      setSelectedDate(dayjs(preSelectedDate));
    }
  }, [movieId, preSelectedTheater, preSelectedDate]);

  useEffect(() => {
    if (!selectedTheater || !selectedDate) return;
    const dateStr = selectedDate.format('YYYY-MM-DD');
    axios.get(`http://localhost:5000/api/showtimes`, {
      params: {
        movie_id: movieId,
        theater_id: selectedTheater,
        date: dateStr
      }
    })
      .then(res => setShowtimes(res.data))
      .catch(() => message.error("Không thể tải suất chiếu"));
  }, [selectedTheater, selectedDate, movieId]);

  const handleBooking = (showtime) => {
    navigate(`/booking/${showtime.id}`, {
      state: {
        movie: movie,
        showtime: showtime
      }
    });
  };

  if (!movie) return <p>Đang tải...</p>;

  return (
    <div style={{ padding: '24px 48px', width: '90vw' }}>
      <Row gutter={32}>
        <Col span={6}>
          <img src={movie.poster} alt={movie.title} style={{ width: '100%', borderRadius: 8 }} />
        </Col>
        <Col span={18}>
          <h1>{movie.title}</h1>
          <p><strong>Mô Tả : </strong>{movie.description}</p>
          <p><strong>ĐẠO DIỄN:</strong> {movie.director}</p>
          <p><strong>DIỄN VIÊN:</strong> {movie.main_actors}</p>
          <p><strong>THỂ LOẠI:</strong> {movie.genre}</p>
          <p><strong>THỜI LƯỢNG:</strong> {movie.duration} phút</p>
          <p><strong>NGÔN NGỮ:</strong> {movie.language}</p>
          <p><strong>KHỞI CHIẾU:</strong> {dayjs(movie.release_date).format('DD/MM/YYYY')}</p>
        </Col>
      </Row>

      <div style={{ marginTop: 32 }}>
        <h2>Chọn rạp chiếu</h2>
        <Select
          style={{ width: 300 }}
          placeholder="Chọn rạp chiếu"
          onChange={handleTheaterChange}
          value={selectedTheater}
          allowClear
        >
          {theaters.map(theater => (
            <Option key={theater.id} value={theater.id}>{theater.name}</Option>
          ))}
        </Select>
      </div>

      {selectedTheater && (
        <>
          <h2 style={{ marginTop: 32 }}>Chọn ngày chiếu</h2>
          <Row gutter={16}>
            {dates.map(date => (
              <Col key={date.format('YYYY-MM-DD')}>
                <Button
                  type={date.isSame(selectedDate, 'day') ? 'primary' : 'default'}
                  onClick={() => setSelectedDate(date)}
                >
                  {date.format('DD/MM')} - {date.format('dd')}
                </Button>
              </Col>
            ))}
          </Row>

          <h2 style={{ marginTop: 32 }}>Các suất chiếu</h2>
          <Row gutter={[16, 16]}>
            {showtimes.map(st => (
              <Col key={st.id}>
                <Card
                  title={dayjs(st.show_time).format('HH:mm')}
                  style={{ width: 120, textAlign: 'center' }}
                  hoverable
                  onClick={() => handleBooking(st)}
                >
                  <p>{st.available_seats} ghế trống</p>
                </Card>
              </Col>
            ))}
            {!showtimes.length && <p>Không có suất chiếu cho ngày này</p>}
          </Row>
        </>
      )}
    </div>
  );
};

export default ShowTimes;