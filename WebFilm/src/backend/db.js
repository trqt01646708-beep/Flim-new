// db.js
const mysql = require('mysql2');

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',        // đổi nếu bạn có mật khẩu
  database: 'cinema_db'
});

db.connect((err) => {
  if (err) {
    console.error('❌ Kết nối DB thất bại:', err);
    process.exit(1);
  }
  console.log('✅ Đã kết nối cơ sở dữ liệu MySQL');
});

module.exports = db;
