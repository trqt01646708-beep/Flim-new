const express = require('express');
const router = express.Router();
const moviePostSuggestionsController = require('../controllers/moviePostSuggestionsController');
const movieGetSuggestionsController = require('../controllers/movieGetSuggestionsController');
const { verifyAdmin } = require('../middlewares/adminAuth');
const uploadSuggestion = require('../middlewares/uploadSuggestionMiddleware');

// Upload poster
router.post('/upload-poster', verifyAdmin, uploadSuggestion.single('poster'), moviePostSuggestionsController.uploadSuggestionPoster);

// Create suggestion
router.post('/', verifyAdmin, moviePostSuggestionsController.createSuggestion);

// Get suggestions
router.get('/', verifyAdmin, movieGetSuggestionsController.getSuggestions);

// Approve/Reject - QUAN TRỌNG: PHẢI DÙNG PUT
router.put('/:id/approve', (req, res, next) => {
  console.log('🔵 APPROVE route hit, ID:', req.params.id);
  next();
}, verifyAdmin, movieGetSuggestionsController.approveSuggestion);

router.put('/:id/reject', (req, res, next) => {
  console.log('🔴 REJECT route hit, ID:', req.params.id);
  next();
}, verifyAdmin, movieGetSuggestionsController.rejectSuggestion);

module.exports = router;