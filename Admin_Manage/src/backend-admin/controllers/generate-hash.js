const bcrypt = require('bcrypt');

const password = '123456'; // 🔐 Mật khẩu gốc bạn muốn đặt
const saltRounds = 10;

bcrypt.hash(password, saltRounds, function(err, hash) {
  if (err) throw err;
  console.log('🔑 Mật khẩu mã hoá:', hash);
});
