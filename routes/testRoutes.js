const express = require('express');
const router = express.Router();
const {
  createTest,
  getAllTests,
  getTestsByCourse,
  getAvailableTests,
  getTest,
  startTest
} = require('../controllers/testController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protect endpoints that rely on the authenticated user
router.get('/', protect, getAllTests);
router.get('/available', protect, getAvailableTests);
router.get('/course/:courseId', protect, getTestsByCourse);
router.get('/:id', getTest);
router.post('/', protect, authorize('teacher'), createTest);
router.post('/:id/start', protect, startTest);

module.exports = router;
