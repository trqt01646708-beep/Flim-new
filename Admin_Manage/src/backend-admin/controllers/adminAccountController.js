const db = require('../db');
const bcrypt = require('bcrypt');

// ✅ Tạo tài khoản admin (giữ nguyên, chỉ thêm created_by)
exports.createAdminAccount = (req, res) => {
  const { role, id } = req.admin;
  if (role !== 'super_admin') return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });

  const { username, password, email, full_name, assigned_theater_id } = req.body;
  const saltRounds = 10;

  const checkSql = 'SELECT * FROM admin_accounts WHERE username = ?';
  db.query(checkSql, [username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length > 0) return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });

    bcrypt.hash(password, saltRounds, (errHash, hashedPassword) => {
      if (errHash) return res.status(500).json({ error: 'Lỗi mã hóa mật khẩu' });

      const insertSql = `
        INSERT INTO admin_accounts (username, password, email, full_name, assigned_theater_id, role, created_by)
        VALUES (?, ?, ?, ?, ?, 'theater_admin', ?)
      `;
      db.query(insertSql, [username, hashedPassword, email, full_name, assigned_theater_id, id], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Tạo tài khoản admin thường thành công' });
      });
    });
  });
};

// ✅ Lấy danh sách rạp (giữ nguyên)
exports.getAllTheaters = (req, res) => {
  const sql = 'SELECT id, name FROM theaters ORDER BY name';
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: 'Lỗi truy vấn rạp' });
    res.json(result);
  });
};

// 🆕 Lấy danh sách tất cả admin accounts
exports.getAllAdminAccounts = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });
  }

  const sql = `
    SELECT 
      a.id,
      a.username,
      a.email,
      a.full_name,
      a.role,
      a.assigned_theater_id,
      t.name AS theater_name,
      t.address AS theater_address,
      creator.username AS created_by_username,
      creator.full_name AS created_by_name
    FROM admin_accounts a
    LEFT JOIN theaters t ON a.assigned_theater_id = t.id
    LEFT JOIN admin_accounts creator ON a.created_by = creator.id
    WHERE a.role = 'theater_admin'
    ORDER BY a.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Lỗi lấy danh sách admin:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
};

// 🆕 Sửa admin account
exports.updateAdminAccount = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });
  }

  const { id } = req.params;
  const { email, full_name, assigned_theater_id, password } = req.body;

  // Kiểm tra không phải super_admin
  const checkSql = 'SELECT role FROM admin_accounts WHERE id = ?';
  db.query(checkSql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    if (rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Không thể sửa tài khoản super_admin' });
    }

    // Nếu có password mới thì hash
    if (password && password.trim() !== '') {
      bcrypt.hash(password, 10, (errHash, hashedPassword) => {
        if (errHash) return res.status(500).json({ error: 'Lỗi mã hóa mật khẩu' });

        const updateSql = `
          UPDATE admin_accounts 
          SET email = ?, full_name = ?, assigned_theater_id = ?, password = ?
          WHERE id = ?
        `;
        db.query(updateSql, [email, full_name, assigned_theater_id, hashedPassword, id], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: 'Cập nhật tài khoản thành công' });
        });
      });
    } else {
      // Không đổi password
      const updateSql = `
        UPDATE admin_accounts 
        SET email = ?, full_name = ?, assigned_theater_id = ?
        WHERE id = ?
      `;
      db.query(updateSql, [email, full_name, assigned_theater_id, id], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ message: 'Cập nhật tài khoản thành công' });
      });
    }
  });
};

// 🆕 Xóa admin account
exports.deleteAdminAccount = (req, res) => {
  const { role } = req.admin;
  if (role !== 'super_admin') {
    return res.status(403).json({ error: 'Chỉ super_admin mới được phép' });
  }

  const { id } = req.params;

  // Không cho xóa chính mình
  if (parseInt(id) === req.admin.id) {
    return res.status(400).json({ error: 'Không thể xóa chính tài khoản của bạn' });
  }

  // Kiểm tra xem có phải super_admin không
  const checkSql = 'SELECT role FROM admin_accounts WHERE id = ?';
  db.query(checkSql, [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
    }

    if (rows[0].role === 'super_admin') {
      return res.status(403).json({ error: 'Không thể xóa tài khoản super_admin' });
    }

    // Xóa admin
    const deleteSql = 'DELETE FROM admin_accounts WHERE id = ?';
    db.query(deleteSql, [id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Đã xóa tài khoản thành công' });
    });
  });
};

exports.updateOwnAccount = async (req, res) => {
  const { id } = req.admin;
  const { full_name, email, password } = req.body;

  try {
    // Nếu có password mới thì hash
    if (password && password.trim() !== '') {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const updateSql = `
        UPDATE admin_accounts 
        SET full_name = ?, email = ?, password = ?
        WHERE id = ?
      `;
      db.query(updateSql, [full_name, email, hashedPassword, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cập nhật thông tin thành công' });
      });
    } else {
      // Không đổi password
      const updateSql = `
        UPDATE admin_accounts 
        SET full_name = ?, email = ?
        WHERE id = ?
      `;
      db.query(updateSql, [full_name, email, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Cập nhật thông tin thành công' });
      });
    }
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Lỗi cập nhật thông tin' });
  }
};