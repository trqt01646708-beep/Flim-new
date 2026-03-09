const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;
  
  // Kiểm tra đầu vào
  if (!username || !password) {
    console.log('❌ Thiếu tên đăng nhập hoặc mật khẩu');
    return res.status(400).json({ error: 'Thiếu tên đăng nhập hoặc mật khẩu' });
  }

  console.log('🔍 Đang thử đăng nhập với username:', username);
  console.log('🔍 Password được gửi:', password ? 'Có' : 'Không');
  
  const sql = 'SELECT * FROM admin_accounts WHERE username = ?';
  db.query(sql, [username], async (err, result) => {
    if (err) {
      console.error('❌ LỖI SQL:', err);
      return res.status(500).json({ error: 'Lỗi truy vấn cơ sở dữ liệu' });
    }
    
    console.log('📊 Kết quả truy vấn:', result);
    console.log('📊 Số lượng tài khoản tìm được:', result.length);
    
    if (!result.length) {
      console.log('❌ Không tìm thấy tài khoản:', username);
      return res.status(401).json({ error: 'Tài khoản không tồn tại' });
    }

    const admin = result[0];
    console.log('👤 Tìm thấy admin:', { 
      id: admin.id, 
      username: admin.username, 
      role: admin.role,
      coMatKhau: !!admin.password,
      doDaiMatKhau: admin.password ? admin.password.length : 0,
      assigned_theater_id: admin.assigned_theater_id
    });

    try {
      console.log('🔐 Đang so sánh mật khẩu...');
      const isMatch = await bcrypt.compare(password, admin.password);
      console.log('🔐 Kết quả so sánh mật khẩu:', isMatch ? 'ĐÚNG' : 'SAI');
      
      if (!isMatch) {
        console.log('❌ Mật khẩu sai cho user:', username);
        return res.status(401).json({ error: 'Sai mật khẩu' });
      }

      console.log('🔑 Tạo JWT token...');
      const token = jwt.sign({
        id: admin.id,
        role: admin.role,
        assigned_theater_id: admin.assigned_theater_id
      }, process.env.JWT_SECRET || 'admin_secret_key', { expiresIn: '1d' });

      console.log('✅ Đăng nhập thành công cho:', username);
      
      res.json({
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          role: admin.role,
          assigned_theater_id: admin.assigned_theater_id
        }
      });
    } catch (bcryptError) {
      console.error('❌ Lỗi bcrypt:', bcryptError);
      return res.status(500).json({ error: 'Lỗi xác thực mật khẩu' });
    }
  });
};