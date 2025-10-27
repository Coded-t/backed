const express = require('express');
const router = express.Router();
const {
  submitTest,
  saveAnswer,
  getAttempt,
  getMyResults,
  publishResult,
  autoSubmitExpiredTests,
  getTestResults
} = require('../controllers/resultController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/my-results', protect, authorize('student'), getMyResults);
router.get('/test/:testId', protect, authorize('teacher'), getTestResults);
router.get('/attempt/:attemptId', protect, getAttempt);
router.post('/attempt/:attemptId/submit', protect, authorize('student'), submitTest);
router.put('/attempt/:attemptId/answer', protect, authorize('student'), saveAnswer);
router.post('/publish/:attemptId', protect, authorize('teacher'), publishResult);
router.post('/auto-submit', autoSubmitExpiredTests);

module.exports = router;
