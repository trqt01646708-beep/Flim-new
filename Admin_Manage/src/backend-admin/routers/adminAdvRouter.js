const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const adminAdvController = require('../controllers/adminAdvController');
const { uploadTicketPriceBanner } = require('../middlewares/multerTicketPriceConfig');
const { uploadBanner } = require('../middlewares/multerBannerConfig');
const { verifyAdmin } = require('../middlewares/adminAuth');


// Tạo thư mục uploads/banners nếu chưa có
const uploadsDir = path.join(__dirname, '../uploads/banners');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Đã tạo thư mục uploads/banners');
}

// Middleware xác thực admin
const authenticateAdmin = (req, res, next) => {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token không được cung cấp' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'admin_secret_key');
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Cấu hình multer cho upload banner
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'banner-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif)'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter
});

// Routes
router.get('/', authenticateAdmin, adminAdvController.getAllBanners);
router.post('/upload', authenticateAdmin, upload.single('banner'), adminAdvController.uploadBannerImage);
router.post('/', authenticateAdmin, adminAdvController.addBanner);
router.put('/:id', authenticateAdmin, adminAdvController.editBanner);
router.delete('/:id', authenticateAdmin, adminAdvController.deleteBanner);







// === TICKET PRICE BANNERS ROUTES ===
router.get('/ticket-price-banners', verifyAdmin, adminAdvController.getAllTicketPriceBanners);
router.post('/ticket-price-banners/upload', verifyAdmin, uploadTicketPriceBanner, adminAdvController.uploadTicketPriceBannerImage);
router.post('/ticket-price-banners', verifyAdmin, adminAdvController.addTicketPriceBanner);
router.put('/ticket-price-banners/:id', verifyAdmin, adminAdvController.editTicketPriceBanner);
router.delete('/ticket-price-banners/:id', verifyAdmin, adminAdvController.deleteTicketPriceBanner);

module.exports = router;