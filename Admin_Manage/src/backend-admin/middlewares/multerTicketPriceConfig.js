// middlewares/multerTicketPriceConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục ticket-price-banners nếu chưa có
const ticketPriceBannerDir = path.join(__dirname, '../uploads/ticket-price-banners');
if (!fs.existsSync(ticketPriceBannerDir)) {
  fs.mkdirSync(ticketPriceBannerDir, { recursive: true });
  console.log('Đã tạo thư mục uploads/ticket-price-banners');
}

// Cấu hình storage cho ticket price banner
const ticketPriceBannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ticketPriceBannerDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'ticket-price-banner-' + uniqueSuffix + ext);
  }
});

// File filter cho ticket price banner
const ticketPriceBannerFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (JPEG, JPG, PNG, WEBP)'), false);
  }
};

// Tạo upload middleware cho ticket price banner
const uploadTicketPriceBanner = multer({
  storage: ticketPriceBannerStorage,
  fileFilter: ticketPriceBannerFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
}).single('ticket_price_banner');

module.exports = { uploadTicketPriceBanner };