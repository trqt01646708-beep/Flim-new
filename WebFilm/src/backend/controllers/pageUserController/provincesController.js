// controllers/provincesController.js
const db = require('../../db');

exports.getAllProvinces = (req, res) => {
  const sql = 'SELECT * FROM provinces';

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
