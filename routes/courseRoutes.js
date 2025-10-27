const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getMyCourses,
  searchCourses,
  getCourse
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getAllCourses);
router.get('/search', protect, searchCourses);
router.get('/my-courses', protect, getMyCourses);
router.get('/:id', protect, getCourse);
router.post('/', protect, authorize('teacher'), createCourse);

module.exports = router;
