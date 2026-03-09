const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db');

const JWT_SECRET = 'your_secret_key';

// Hàm validate password
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ in hoa');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  }
  
  return errors;
};

// Hàm validate email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.register = async (req, res) => {
  const { username, password, email } = req.body;

  // Kiểm tra dữ liệu bắt buộc
  if (!username || !password || !email) {
    return res.status(400).json({ 
      message: 'Vui lòng điền đầy đủ thông tin!',
      errors: {
        username: !username ? 'Tên đăng nhập không được để trống' : null,
        password: !password ? 'Mật khẩu không được để trống' : null,
        email: !email ? 'Email không được để trống' : null
      }
    });
  }

  // Validate username
  if (username.length < 3) {
    return res.status(400).json({ 
      message: 'Tên đăng nhập phải có ít nhất 3 ký tự',
      field: 'username'
    });
  }

  if (username.length > 50) {
    return res.status(400).json({ 
      message: 'Tên đăng nhập không được vượt quá 50 ký tự',
      field: 'username'
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({ 
      message: 'Email không đúng định dạng',
      field: 'email'
    });
  }

  // Validate password
  const passwordErrors = validatePassword(password);
  if (passwordErrors.length > 0) {
    return res.status(400).json({ 
      message: 'Mật khẩu không đáp ứng yêu cầu',
      errors: passwordErrors,
      field: 'password'
    });
  }

  try {
    // Kiểm tra username đã tồn tại
    const [existingUsername] = await db.promise().query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (existingUsername.length > 0) {
      return res.status(400).json({ 
        message: 'Tên đăng nhập đã được sử dụng',
        field: 'username'
      });
    }

    // Kiểm tra email đã tồn tại
    const [existingEmail] = await db.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    
    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        message: 'Email đã được sử dụng',
        field: 'email'
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm user mới
    await db.promise().query(
      'INSERT INTO users (username, password, email, points, moneySpent) VALUES (?, ?, ?, 0, 0)',
      [username, hashedPassword, email]
    );

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng ký' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp username và password!' });
  }

  try {
    const [users] = await db.promise().query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ message: 'Tên đăng nhập không tồn tại' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points || 0,
        moneySpent: user.moneySpent || 0,
      },
    });
  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
  }
};