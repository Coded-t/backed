const Course = require('../models/Course');

// @desc    Create a course
// @route   POST /api/courses
// @access  Private/Teacher
const createCourse = async (req, res) => {
  try {
    const { courseCode, courseTitle, description } = req.body;

    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseTitle,
      description,
      teacher: req.user._id
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getAllCourses = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { role, _id: userId } = req.user;
    console.log('Getting courses for user:', { userId, role });
    
    // Teachers only see their own courses
    const query = role === 'teacher' ? { teacher: userId } : {};
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ courseCode: 1 });

    console.log(`Found ${courses.length} courses`);
    res.json(courses);
  } catch (error) {
    console.error('Error getting courses:', error);
    res.status(500).json({ 
      message: 'Error retrieving courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get courses by teacher
// @route   GET /api/courses/my-courses
// @access  Private
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ teacher: req.user._id });
    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Search courses by code or title
// @route   GET /api/courses/search
// @access  Private
const searchCourses = async (req, res) => {
  try {
    const { search } = req.query;
    const { role, _id: userId } = req.user;
    
    // Base search query
    const searchQuery = {
      $or: [
        { courseCode: { $regex: search, $options: 'i' } },
        { courseTitle: { $regex: search, $options: 'i' } }
      ]
    };
    
    // Add teacher filter for teacher role
    if (role === 'teacher') {
      searchQuery.teacher = userId;
    }
    
    const courses = await Course.find(searchQuery).populate('teacher', 'name');

    res.json(courses);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const course = await Course.findById(req.params.id).populate('teacher', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if teacher is trying to access another teacher's course
    if (role === 'teacher' && course.teacher._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this course' });
    }

    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getMyCourses,
  searchCourses,
  getCourse
};
