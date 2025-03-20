// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './data/surveys/');
  },
  filename: (req, file, cb) => {
    cb(null, 'survey-questions.xml');
  }
});

const upload = multer({ storage });

// Login route
router.post('/login', adminController.login);

// Protected routes (require authentication)
router.use(authMiddleware);

// Upload XML file with survey questions
router.post('/upload', upload.single('file'), adminController.uploadSurvey);

// Get all responses
router.get('/responses', adminController.getResponses);

// Download a specific response
router.get('/responses/:id', adminController.downloadResponse);

// Get survey statistics
router.get('/stats', adminController.getStats);

module.exports = router;