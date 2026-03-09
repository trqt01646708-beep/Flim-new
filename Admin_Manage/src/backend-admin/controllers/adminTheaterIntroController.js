const db = require('../db');
const fs = require('fs');
const path = require('path');

// Lấy tất cả theater intro banners
exports.getAllTheaterIntroBanners = (req, res) => {
  const { role, assigned_theater_id } = req.admin;

  let sql, params = [];

  if (role === 'super_admin') {
    sql = `
      SELECT tib.*, t.name as theater_name, aa.username as created_by_username 
      FROM theater_intro_banners tib 
      LEFT JOIN theaters t ON tib.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON tib.created_by_admin_id = aa.id
      ORDER BY tib.created_at DESC
    `;
  } else {
    sql = `
      SELECT tib.*, t.name as theater_name, aa.username as created_by_username 
      FROM theater_intro_banners tib 
      LEFT JOIN theaters t ON tib.theater_id = t.id 
      LEFT JOIN admin_accounts aa ON tib.created_by_admin_id = aa.id
      WHERE tib.theater_id = ?
      ORDER BY tib.created_at DESC
    `;
    params = [assigned_theater_id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Lỗi lấy danh sách theater intro banner:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// Upload theater intro banner image
exports.uploadTheaterIntroBannerImage = (req, res) => {
  console.log('Upload theater intro banner request:', req.file);
  
  if (!req.file) {
    return res.status(400).json({ error: 'Không có file được upload' });
  }
  
  const filename = req.file.filename;
  const bannerUrl = `/uploads/theater-intro-banners/${filename}`;
  const fullUrl = `http://localhost:5001${bannerUrl}`;
  
  res.json({ 
    message: 'Upload theater intro banner thành công',
    image_url: fullUrl,
    filename: filename,
    path: bannerUrl
  });
};

// Thêm theater intro banner mới
exports.addTheaterIntroBanner = async (req, res) => {
  try {
    const { image_path, theater_id, is_active } = req.body;
    const admin_id = req.admin.id;

    const sql = `
      INSERT INTO theater_intro_banners 
      (theater_id, image_url, is_active, created_by_admin_id, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(
      sql,
      [theater_id, image_path, is_active !== false ? 1 : 0, admin_id],
      (err, result) => {
        if (err) {
          console.error('Error adding theater intro banner:', err);
          return res.status(500).json({ error: 'Lỗi thêm banner' });
        }
        res.json({ 
          message: 'Thêm banner thành công', 
          id: result.insertId 
        });
      }
    );
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Sửa theater intro banner
exports.editTheaterIntroBanner = (req, res) => {
  const { role, assigned_theater_id } = req.admin;
  const bannerId = req.params.id;
  const { image_path, is_active, theater_id } = req.body;

  let checkPermissionSql, checkParams;

  if (role === 'super_admin') {
    checkPermissionSql = `SELECT * FROM theater_intro_banners WHERE id = ?`;
    checkParams = [bannerId];
  } else {
    checkPermissionSql = `SELECT * FROM theater_intro_banners WHERE id = ? AND theater_id = ?`;
    checkParams = [bannerId, assigned_theater_id];
  }

  db.query(checkPermissionSql, checkParams, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(403).json({ error: 'Không có quyền sửa banner này' });
    }

    const image_url = image_path ? `http://localhost:5001${image_path}` : undefined;
    let sql = `UPDATE theater_intro_banners SET is_active = ?, theater_id = ?`;
    let values = [is_active, role === 'super_admin' ? theater_id : assigned_theater_id];

    if (image_url) {
      sql = `UPDATE theater_intro_banners SET image_url = ?, is_active = ?, theater_id = ?`;
      values = [image_url, is_active, role === 'super_admin' ? theater_id : assigned_theater_id];
    }

    sql += ` WHERE id = ?`;
    values.push(bannerId);

    db.query(sql, values, (err) => {
      if (err) {
        console.error('Lỗi cập nhật theater intro banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Cập nhật banner thành công' });
    });
  });
};

// Xóa theater intro banner
exports.deleteTheaterIntroBanner = (req, res) => {
  const { role, assigned_theater_id } = req.admin;
  const bannerId = req.params.id;

  let checkPermissionSql, checkParams;

  if (role === 'super_admin') {
    checkPermissionSql = `SELECT * FROM theater_intro_banners WHERE id = ?`;
    checkParams = [bannerId];
  } else {
    checkPermissionSql = `SELECT * FROM theater_intro_banners WHERE id = ? AND theater_id = ?`;
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
    if (banner.image_url && banner.image_url.includes('/uploads/theater-intro-banners/')) {
      try {
        const filename = banner.image_url.split('/uploads/theater-intro-banners/')[1];
        const filePath = path.join(__dirname, '../uploads/theater-intro-banners/', filename);
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Lỗi xóa file:', err.message);
      }
    }

    db.query('DELETE FROM theater_intro_banners WHERE id = ?', [bannerId], (err) => {
      if (err) {
        console.error('Lỗi xóa theater intro banner:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Đã xóa banner thành công' });
    });
  });
};