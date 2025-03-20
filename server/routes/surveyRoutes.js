// routes/surveyRoutes.js
const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');

// Get a new survey session (assigns a unique ID to the user)
router.get('/start', surveyController.startSurvey);

// Get survey questions and website designs
router.get('/questions/:sessionId', surveyController.getQuestions);

// Submit demographic answers
router.post('/demographics/:sessionId', surveyController.submitDemographics);

// Submit answers for a specific website design
router.post('/submit/:sessionId', surveyController.submitAnswers);

// Complete the survey (final page)
router.post('/complete/:sessionId', surveyController.completeSurvey);

module.exports = router;