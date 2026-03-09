const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // nếu có mật khẩu XAMPP thì điền vào
  database: 'cinema_db',
});

db.connect((err) => {
  if (err) throw err;
  console.log('✅ Kết nối MySQL (XAMPP) thành công!');
});

module.exports = db;
