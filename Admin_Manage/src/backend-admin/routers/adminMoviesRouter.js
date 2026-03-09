const express = require('express');
const router = express.Router();
const adminMoviesController = require('../controllers/adminMoviesController');
const { verifyAdmin, requireSuperAdmin } = require('../middlewares/adminAuth');
const upload = require('../middlewares/uploadMiddleware');

// ✅ Tất cả routes cần xác thực là super_admin
router.use(verifyAdmin, requireSuperAdmin);

// Lấy danh sách phim
router.get('/', adminMoviesController.getAllMovies);

// Thêm phim
router.post('/', adminMoviesController.addMovie); // ✅ sửa createMovie -> addMovie

// Sửa phim
router.put('/:id', adminMoviesController.editMovie); // ✅ sửa updateMovie -> editMovie

// Xoá phim
router.delete('/:id', adminMoviesController.deleteMovie); // ✅ sửa movie_id -> id

router.post('/upload-poster', verifyAdmin, upload.single('poster'), adminMoviesController.uploadPoster);

module.exports = router;
