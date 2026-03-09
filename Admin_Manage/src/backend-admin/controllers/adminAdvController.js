// Tạo file controllers/adminAdvController.js cho admin server

const db = require('../db');
const fs = require('fs');
const path = require('path');

// Lấy tất cả banner cho admin
exports.getAllBanners = (req, res) => {
  const { role, assigned_theater_id, id: admin_id } = req.admin;

  let sql, params = [];

  if (role === 'super_admin') {
    // Super admin thấy tất cả banner
    sql = `
      SELECT a.*, t.name as theater_name, aa.username as created_by_username 
      FROM adv a 
      LEFT JOIN theaters t ON a.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON a.created_by_admin_id = aa.id
      ORDER BY a.created_at DESC
    `;
  } else {
    // Theater admin chỉ thấy banner global và banner của rạp mình
    sql = `
      SELECT a.*, t.name as theater_name, aa.username as created_by_username 
      FROM adv a 
      LEFT JOIN theaters t ON a.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON a.created_by_admin_id = aa.id
      WHERE a.theater_id IS NULL OR a.theater_id = ?
      ORDER BY a.created_at DESC
    `;
    params = [assigned_theater_id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi lấy danh sách banner:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// Upload banner image
exports.uploadBannerImage = (req, res) => {
  console.log('Upload banner request:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được upload' });
  }
  
  const filename = req.file.filename;
  const bannerUrl = `/uploads/banners/${filename}`;
  const fullUrl = `http://localhost:5001${bannerUrl}`;
  
  console.log('Upload banner thành công:', fullUrl);
  
  res.json({ 
    message: 'Upload banner thành công',
    image_url: fullUrl,
    filename: filename,
    path: bannerUrl
  });
};

// Thêm banner mới
exports.addBanner = (req, res) => {
  const { role, assigned_theater_id, id: admin_id } = req.admin;
  const { title, image_path, link, is_active, theater_id } = req.body;

  // Validate quyền hạn
  if (role === 'theater_admin' && theater_id && theater_id !== assigned_theater_id && theater_id !== 'global') {
    return res.status(403).json({ error: 'Theater admin chỉ có thể tạo banner cho rạp được gán hoặc banner global' });
  }

  // Convert relative path thành full URL
  const image_url = image_path ? `http://localhost:5001${image_path}` : null;

  // Xác định theater_id cuối cùng
  let final_theater_id = null;
  if (role === 'super_admin') {
    final_theater_id = theater_id && theater_id !== 'global' ? theater_id : null;
  } else {
    final_theater_id = theater_id === 'global' ? null : assigned_theater_id;
  }

  const sql = `
    INSERT INTO adv (title, image_url, link, is_active, theater_id, created_by_admin_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [title, image_url, link, is_active, final_theater_id, admin_id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Lỗi thêm banner:', err);
      return res.status(500).json({ error: err.message });
    }
    console.log('Thêm banner thành công, ID:', result.insertId);
    res.json({ message: 'Thêm banner thành công', banner_id: result.insertId });
  });
};

// Sửa banner
exports.editBanner = (req, res) => {
  const { role, assigned_theater_id, id: admin_id } = req.admin;
  const bannerId = req.params.id;
  const { title, image_path, link, is_active, theater_id } = req.body;

  // Kiểm tra quyền sửa banner
  const checkPermissionSql = `
    SELECT * FROM adv WHERE id = ? AND (
      ? = 'super_admin' OR 
      theater_id IS NULL OR 
      theater_id = ? OR
      created_by_admin_id = ?
    )
  `;

  db.query(checkPermissionSql, [bannerId, role, assigned_theater_id, admin_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Không có quyền sửa banner này' });
    }

    const image_url = image_path ? `http://localhost:5001${image_path}` : undefined;

    let sql = `UPDATE adv SET title = ?, link = ?, is_active = ?, theater_id = ?`;
    let values = [title, link, is_active];

    // Xác định theater_id cuối cùng
    if (role === 'super_admin') {
      values.push(theater_id && theater_id !== 'global' ? theater_id : null);
    } else {
      values.push(theater_id === 'global' ? null : assigned_theater_id);
    }

    // Nếu có image mới thì update
    if (image_url) {
      sql = `UPDATE adv SET title = ?, image_url = ?, link = ?, is_active = ?, theater_id = ?`;
      values = [title, image_url, link, is_active];
      
      if (role === 'super_admin') {
        values.push(theater_id && theater_id !== 'global' ? theater_id : null);
      } else {
        values.push(theater_id === 'global' ? null : assigned_theater_id);
      }
    }

    sql += ` WHERE id = ?`;
    values.push(bannerId);

    db.query(sql, values, (err) => {
      if (err) {
        console.error('Lỗi cập nhật banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Cập nhật banner thành công' });
    });
  });
};

// Xóa banner
exports.deleteBanner = (req, res) => {
  const { role, assigned_theater_id, id: admin_id } = req.admin;
  const bannerId = req.params.id;

  // Kiểm tra quyền xóa - FIXED LOGIC
  let checkPermissionSql;
  let queryParams;

  if (role === 'super_admin') {
    // Super admin có thể xóa tất cả banner
    checkPermissionSql = `SELECT * FROM adv WHERE id = ?`;
    queryParams = [bannerId];
  } else {
    // Theater admin chỉ có thể xóa:
    // 1. Banner của chính họ tạo (created_by_admin_id = admin_id)
    // 2. Banner thuộc rạp được gán (theater_id = assigned_theater_id)
    // KHÔNG được xóa banner global (theater_id IS NULL) do super_admin tạo
    checkPermissionSql = `
      SELECT * FROM adv WHERE id = ? AND (
        (created_by_admin_id = ? AND theater_id = ?) OR
        (theater_id = ? AND created_by_admin_id = ?)
      )
    `;
    queryParams = [bannerId, admin_id, assigned_theater_id, assigned_theater_id, admin_id];
  }

  db.query(checkPermissionSql, queryParams, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ 
        error: 'Không có quyền xóa banner này. Theater admin chỉ được xóa banner do mình tạo.' 
      });
    }

    const banner = rows[0];

    // Xóa file nếu là local file
    if (banner.image_url && banner.image_url.includes('/uploads/banners/')) {
      try {
        const filename = banner.image_url.split('/uploads/banners/')[1];
        const filePath = path.join(__dirname, '../uploads/banners/', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('Đã xóa file banner:', filename);
        }
      } catch (err) {
        console.error('Lỗi xóa file banner:', err.message);
      }
    }

    // Xóa banner khỏi database
    db.query('DELETE FROM adv WHERE id = ?', [bannerId], (err) => {
      if (err) {
        console.error('Lỗi xóa banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Đã xóa banner thành công' });
    });
  });
};


// Lấy tất cả ticket price banners cho admin
exports.getAllTicketPriceBanners = (req, res) => {
  const { role, assigned_theater_id } = req.admin;

  let sql, params = [];

  if (role === 'super_admin') {
    sql = `
      SELECT tpb.*, t.name as theater_name, aa.username as created_by_username 
      FROM ticket_price_banners tpb 
      LEFT JOIN theaters t ON tpb.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON tpb.created_by_admin_id = aa.id
      ORDER BY tpb.created_at DESC
    `;
  } else {
    sql = `
      SELECT tpb.*, t.name as theater_name, aa.username as created_by_username 
      FROM ticket_price_banners tpb 
      LEFT JOIN theaters t ON tpb.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON tpb.created_by_admin_id = aa.id
      WHERE tpb.theater_id = ?
      ORDER BY tpb.created_at DESC
    `;
    params = [assigned_theater_id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi lấy danh sách ticket price banner:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// Upload ticket price banner image
exports.uploadTicketPriceBannerImage = (req, res) => {
  console.log('Upload ticket price banner request:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được upload' });
  }
  
  const filename = req.file.filename;
  const bannerUrl = `/uploads/ticket-price-banners/${filename}`;
  const fullUrl = `http://localhost:5001${bannerUrl}`;
  
  res.json({ 
    message: 'Upload ticket price banner thành công',
    image_url: fullUrl,
    filename: filename,
    path: bannerUrl
  });
};

// Thêm ticket price banner mới
exports.addTicketPriceBanner = (req, res) => {
  const { role, assigned_theater_id, id: admin_id } = req.admin;
  const { image_path, is_active, theater_id } = req.body;

  if (role === 'theater_admin' && theater_id && theater_id !== assigned_theater_id) {
    return res.status(403).json({ error: 'Theater admin chỉ có thể tạo banner cho rạp được gán' });
  }

  const image_url = image_path ? `http://localhost:5001${image_path}` : null;
  const final_theater_id = role === 'super_admin' ? theater_id : assigned_theater_id;

  const sql = `
    INSERT INTO ticket_price_banners (image_url, is_active, theater_id, created_by_admin_id, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  const values = [image_url, is_active, final_theater_id, admin_id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Lỗi thêm ticket price banner:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Thêm ticket price banner thành công', banner_id: result.insertId });
  });
};

// Sửa ticket price banner
exports.editTicketPriceBanner = (req, res) => {
  const { role, assigned_theater_id } = req.admin;
  const bannerId = req.params.id;
  const { image_path, is_active, theater_id } = req.body;

  let checkPermissionSql, checkParams;

  if (role === 'super_admin') {
    checkPermissionSql = `SELECT * FROM ticket_price_banners WHERE id = ?`;
    checkParams = [bannerId];
  } else {
    checkPermissionSql = `SELECT * FROM ticket_price_banners WHERE id = ? AND theater_id = ?`;
    checkParams = [bannerId, assigned_theater_id];
  }

  db.query(checkPermissionSql, checkParams, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Không có quyền sửa banner này' });
    }

    const image_url = image_path ? `http://localhost:5001${image_path}` : undefined;
    let sql = `UPDATE ticket_price_banners SET is_active = ?, theater_id = ?`;
    let values = [is_active, role === 'super_admin' ? theater_id : assigned_theater_id];

    if (image_url) {
      sql = `UPDATE ticket_price_banners SET image_url = ?, is_active = ?, theater_id = ?`;
      values = [image_url, is_active, role === 'super_admin' ? theater_id : assigned_theater_id];
    }

    sql += ` WHERE id = ?`;
    values.push(bannerId);

    db.query(sql, values, (err) => {
      if (err) {
        console.error('Lỗi cập nhật ticket price banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Cập nhật ticket price banner thành công' });
    });
  });
};

// Xóa ticket price banner
exports.deleteTicketPriceBanner = (req, res) => {
  const { role, assigned_theater_id } = req.admin;
  const bannerId = req.params.id;

  let checkPermissionSql, checkParams;

  if (role === 'super_admin') {
    checkPermissionSql = `SELECT * FROM ticket_price_banners WHERE id = ?`;
    checkParams = [bannerId];
  } else {
    checkPermissionSql = `SELECT * FROM ticket_price_banners WHERE id = ? AND theater_id = ?`;
    checkParams = [bannerId, assigned_theater_id];
  }

  db.query(checkPermissionSql, checkParams, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ 
        error: 'Không có quyền xóa banner này' 
      });
    }

    const banner = rows[0];

    // Xóa file nếu cần
    if (banner.image_url && banner.image_url.includes('/uploads/ticket-price-banners/')) {
      try {
        const filename = banner.image_url.split('/uploads/ticket-price-banners/')[1];
        const filePath = path.join(__dirname, '../uploads/ticket-price-banners/', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Lỗi xóa file:', err.message);
      }
    }

    db.query('DELETE FROM ticket_price_banners WHERE id = ?', [bannerId], (err) => {
      if (err) {
        console.error('Lỗi xóa ticket price banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Đã xóa ticket price banner thành công' });
    });
  });
};