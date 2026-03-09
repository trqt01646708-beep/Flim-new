const db = require('../db');
const moment = require('moment');

// Helper function để lấy ngày đầu và cuối tháng
const getDefaultDateRange = () => {
  const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
  const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
  return { startOfMonth, endOfMonth };
};

// Lấy doanh thu cho theater_admin (mặc định tháng hiện tại)
exports.getTheaterRevenue = (req, res) => {
  const { assigned_theater_id, role } = req.admin;
  
  if (role !== 'theater_admin') {
    return res.status(403).json({ error: 'Chỉ theater_admin được phép xem doanh thu rạp' });
  }

  let { start_date, end_date } = req.query;
  
  // Nếu không có ngày, dùng tháng hiện tại
  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  const sql = `
    SELECT 
      t.id as theater_id,
      t.name as theater_name,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(bs.id) as total_tickets,
      COALESCE(SUM(tp.price), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'vip' THEN tp.price ELSE 0 END), 0) as vip_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'standard' THEN tp.price ELSE 0 END), 0) as standard_revenue,
      COUNT(CASE WHEN s.seat_type = 'vip' THEN 1 END) as vip_tickets,
      COUNT(CASE WHEN s.seat_type = 'standard' THEN 1 END) as standard_tickets,
      ? as start_date,
      ? as end_date
    FROM theaters t
    LEFT JOIN show_times st ON t.id = st.theater_id
    LEFT JOIN bookings b ON st.id = b.show_time_id 
      AND b.status = 'confirmed'
      AND DATE(b.created_at) BETWEEN ? AND ?
    LEFT JOIN booking_seats bs ON b.id = bs.booking_id
    LEFT JOIN seats s ON bs.seat_id = s.id
    LEFT JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    WHERE t.id = ?
    GROUP BY t.id, t.name
  `;

  db.query(sql, [start_date, end_date, start_date, end_date, assigned_theater_id], (err, result) => {
    if (err) {
      console.error('Lỗi lấy doanh thu:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(result[0] || {
      theater_id: assigned_theater_id,
      total_bookings: 0,
      total_tickets: 0,
      total_revenue: 0,
      vip_revenue: 0,
      standard_revenue: 0,
      vip_tickets: 0,
      standard_tickets: 0,
      start_date,
      end_date
    });
  });
};

// Lấy doanh thu theo phim cho theater_admin
exports.getTheaterRevenueByMovie = (req, res) => {
  const { assigned_theater_id, role } = req.admin;
  
  if (role !== 'theater_admin') {
    return res.status(403).json({ error: 'Chỉ theater_admin được phép xem' });
  }

  let { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  const sql = `
    SELECT 
      m.id as movie_id,
      m.title as movie_title,
      m.poster,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(bs.id) as total_tickets,
      COALESCE(SUM(tp.price), 0) as total_revenue
    FROM bookings b
    JOIN show_times st ON b.show_time_id = st.id
    JOIN movies m ON st.movie_id = m.id
    JOIN booking_seats bs ON b.id = bs.booking_id
    JOIN seats s ON bs.seat_id = s.id
    JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    WHERE b.status = 'confirmed'
      AND st.theater_id = ?
      AND DATE(b.created_at) BETWEEN ? AND ?
    GROUP BY m.id, m.title, m.poster
    ORDER BY total_revenue DESC
  `;

  db.query(sql, [assigned_theater_id, start_date, end_date], (err, result) => {
    if (err) {
      console.error('Lỗi lấy doanh thu theo phim:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// Super admin - Xem doanh thu theo rạp hoặc tất cả rạp
exports.getSuperAdminRevenue = (req, res) => {
  const { role } = req.admin;
  
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin được phép xem' });
  }

  let { start_date, end_date, theater_id } = req.query;
  
  // Mặc định tháng hiện tại
  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  let theaterCondition = '';
  let params = [start_date, end_date, start_date, end_date];
  
  // Nếu chọn rạp cụ thể
  if (theater_id && theater_id !== 'all') {
    theaterCondition = 'WHERE t.id = ?';
    params.push(theater_id);
  }

  const sql = `
    SELECT 
      t.id as theater_id,
      t.name as theater_name,
      t.address,
      p.name as province_name,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(bs.id) as total_tickets,
      COALESCE(SUM(tp.price), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'vip' THEN tp.price ELSE 0 END), 0) as vip_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'standard' THEN tp.price ELSE 0 END), 0) as standard_revenue,
      ? as start_date,
      ? as end_date
    FROM theaters t
    LEFT JOIN provinces p ON t.province_id = p.id
    LEFT JOIN show_times st ON t.id = st.theater_id
    LEFT JOIN bookings b ON st.id = b.show_time_id 
      AND b.status = 'confirmed'
      AND DATE(b.created_at) BETWEEN ? AND ?
    LEFT JOIN booking_seats bs ON b.id = bs.booking_id
    LEFT JOIN seats s ON bs.seat_id = s.id
    LEFT JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    ${theaterCondition}
    GROUP BY t.id, t.name, t.address, p.name
    ORDER BY total_revenue DESC
  `;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi lấy doanh thu:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Tính tổng
    const summary = {
      start_date,
      end_date,
      total_theaters: result.length,
      grand_total_revenue: 0,
      grand_total_bookings: 0,
      grand_total_tickets: 0,
      grand_vip_revenue: 0,
      grand_standard_revenue: 0,
      theaters: result
    };

    result.forEach(theater => {
      summary.grand_total_revenue += parseFloat(theater.total_revenue || 0);
      summary.grand_total_bookings += parseInt(theater.total_bookings || 0);
      summary.grand_total_tickets += parseInt(theater.total_tickets || 0);
      summary.grand_vip_revenue += parseFloat(theater.vip_revenue || 0);
      summary.grand_standard_revenue += parseFloat(theater.standard_revenue || 0);
    });

    res.json(summary);
  });
};

// Super admin - Bảng xếp hạng rạp theo doanh thu
exports.getTheaterRanking = (req, res) => {
  const { role } = req.admin;
  
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin được phép xem' });
  }

  let { start_date, end_date } = req.query;
  
  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  const sql = `
    SELECT 
      t.id as theater_id,
      t.name as theater_name,
      t.address,
      p.name as province_name,
      COUNT(DISTINCT b.id) as total_bookings,
      COUNT(bs.id) as total_tickets,
      COALESCE(SUM(tp.price), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'vip' THEN tp.price ELSE 0 END), 0) as vip_revenue,
      COALESCE(SUM(CASE WHEN s.seat_type = 'standard' THEN tp.price ELSE 0 END), 0) as standard_revenue
    FROM theaters t
    LEFT JOIN provinces p ON t.province_id = p.id
    LEFT JOIN show_times st ON t.id = st.theater_id
    LEFT JOIN bookings b ON st.id = b.show_time_id 
      AND b.status = 'confirmed'
      AND DATE(b.created_at) BETWEEN ? AND ?
    LEFT JOIN booking_seats bs ON b.id = bs.booking_id
    LEFT JOIN seats s ON bs.seat_id = s.id
    LEFT JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    GROUP BY t.id, t.name, t.address, p.name
    ORDER BY total_revenue DESC
  `;

  db.query(sql, [start_date, end_date], (err, result) => {
    if (err) {
      console.error('Lỗi lấy xếp hạng:', err);
      return res.status(500).json({ error: err.message });
    }
    
    // Thêm thứ hạng
    const ranking = result.map((theater, index) => ({
      rank: index + 1,
      ...theater
    }));

    res.json({
      start_date,
      end_date,
      total_theaters: ranking.length,
      ranking
    });
  });
};

// Lấy doanh thu theo tháng (nhiều tháng) - cho biểu đồ
exports.getRevenueByMonth = (req, res) => {
  const { role, assigned_theater_id } = req.admin;
  let { start_date, end_date, theater_id } = req.query;
  
  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  let theaterCondition = '';
  let params = [start_date, end_date];

  if (role === 'super_admin') {
    if (theater_id && theater_id !== 'all') {
      theaterCondition = 'AND st.theater_id = ?';
      params.push(theater_id);
    }
  } else {
    theaterCondition = 'AND st.theater_id = ?';
    params.push(assigned_theater_id);
  }

  const sql = `
    SELECT 
      DATE_FORMAT(b.created_at, '%Y-%m') as month,
      COUNT(DISTINCT b.id) as bookings,
      COUNT(bs.id) as tickets,
      COALESCE(SUM(tp.price), 0) as revenue
    FROM bookings b
    JOIN show_times st ON b.show_time_id = st.id
    JOIN booking_seats bs ON b.id = bs.booking_id
    JOIN seats s ON bs.seat_id = s.id
    JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    WHERE b.status = 'confirmed'
      AND DATE(b.created_at) BETWEEN ? AND ?
      ${theaterCondition}
    GROUP BY DATE_FORMAT(b.created_at, '%Y-%m')
    ORDER BY month ASC
  `;

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi lấy doanh thu theo tháng:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};
// Lấy doanh thu theo ngày trong khoảng thời gian cho theater_admin
exports.getTheaterRevenueByDate = (req, res) => {
  const { assigned_theater_id, role } = req.admin;
  
  if (role !== 'theater_admin') {
    return res.status(403).json({ error: 'Chỉ theater_admin được phép xem' });
  }

  let { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    const defaults = getDefaultDateRange();
    start_date = defaults.startOfMonth;
    end_date = defaults.endOfMonth;
  }

  const sql = `
    SELECT 
      DATE(b.created_at) as date,
      COUNT(DISTINCT b.id) as bookings,
      COUNT(bs.id) as tickets,
      COALESCE(SUM(tp.price), 0) as revenue
    FROM bookings b
    JOIN show_times st ON b.show_time_id = st.id
    JOIN booking_seats bs ON b.id = bs.booking_id
    JOIN seats s ON bs.seat_id = s.id
    JOIN ticket_prices tp ON st.id = tp.show_time_id AND s.seat_type = tp.seat_type
    WHERE b.status = 'confirmed'
      AND st.theater_id = ?
      AND DATE(b.created_at) BETWEEN ? AND ?
    GROUP BY DATE(b.created_at)
    ORDER BY date ASC
  `;

  db.query(sql, [assigned_theater_id, start_date, end_date], (err, result) => {
    if (err) {
      console.error('Lỗi lấy doanh thu theo ngày:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};