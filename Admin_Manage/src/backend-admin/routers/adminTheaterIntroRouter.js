const express = require('express');
const router = express.Router();
const adminTheaterIntroController = require('../controllers/adminTheaterIntroController');
const { uploadTheaterIntroBanner } = require('../middlewares/multerTheaterIntroConfig');
const { verifyAdmin } = require('../middlewares/adminAuth');

// Routes cho theater intro banners
router.get('/', verifyAdmin, adminTheaterIntroController.getAllTheaterIntroBanners);
router.post('/upload', verifyAdmin, uploadTheaterIntroBanner, adminTheaterIntroController.uploadTheaterIntroBannerImage);
router.post('/', verifyAdmin, adminTheaterIntroController.addTheaterIntroBanner);
router.put('/:id', verifyAdmin, adminTheaterIntroController.editTheaterIntroBanner);
router.delete('/:id', verifyAdmin, adminTheaterIntroController.deleteTheaterIntroBanner);

module.exports = router;