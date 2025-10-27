const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');
const Course = require('../models/Course');

// @desc    Create a test
// @route   POST /api/tests
// @access  Private/Teacher
const createTest = async (req, res) => {
  try {
    const { title, course, questions, duration, availableFrom, availableUntil } = req.body;

    const test = await Test.create({
      title,
      course,
      questions,
      duration,
      availableFrom,
      availableUntil,
      teacher: req.user._id,
      status: 'active'
    });

    // Populate course and teacher data before sending response
    const populatedTest = await Test.findById(test._id)
      .populate('course', 'courseCode courseTitle')
      .populate('teacher', 'name');

    res.status(201).json(populatedTest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private
const getAllTests = async (req, res) => {
  // Defensive: ensure protect middleware ran and set req.user
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized, no user' });
  }
  const { role, _id: userId } = req.user;
  try {
    // For teachers, only return their tests
    // For students or admins, return all active tests
    const query = role === 'teacher' 
      ? { teacher: userId }
      : role === 'student' 
      ? { status: 'active' }
      : {};

    const tests = await Test.find(query)
      .populate({
        path: 'course',
        select: 'courseCode courseTitle teacher',
      })
      .populate('teacher', 'name');
    res.json(tests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get tests by course
// @route   GET /api/tests/course/:courseId
// @access  Private
const getTestsByCourse = async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const courseId = req.params.courseId;

    // First check if teacher owns this course
    if (role === 'teacher') {
      const course = await Course.findOne({
        _id: courseId,
        teacher: userId
      });
      if (!course) {
        return res.status(403).json({ message: 'Not authorized to view tests for this course' });
      }
    }

    const tests = await Test.find({ 
      course: courseId, 
      ...(role === 'student' ? { status: 'active' } : {}) 
    })
      .populate('course', 'courseCode courseTitle');
    res.json(tests);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get available tests for student
// @route   GET /api/tests/available
// @access  Private/Student
const getAvailableTests = async (req, res) => {
  try {
    const now = new Date();
    const tests = await Test.find({
      availableFrom: { $lte: now },
      availableUntil: { $gte: now },
      status: 'active'
    })
      .populate('course', 'courseCode courseTitle')
      .populate('teacher', 'name');

    // Check if student has already attempted the test
    const testsWithAttemptStatus = await Promise.all(
      tests.map(async (test) => {
        const attempt = await TestAttempt.findOne({
          test: test._id,
          student: req.user._id
        });

        return {
          ...test.toObject(),
          attempted: !!attempt,
          attemptId: attempt?._id
        };
      })
    );

    res.json(testsWithAttemptStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get single test
// @route   GET /api/tests/:id
// @access  Public
const getTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('course', 'courseCode courseTitle')
      .populate('teacher', 'name email');

    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    res.json(test);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Start a test attempt
// @route   POST /api/tests/:id/start
// @access  Private/Student
const startTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if test is available
    const now = new Date();
    if (now < test.availableFrom || now > test.availableUntil) {
      return res.status(400).json({ message: 'Test is not available at this time' });
    }

    // Check if student already attempted
    const existingAttempt = await TestAttempt.findOne({
      test: test._id,
      student: req.user._id
    });

    if (existingAttempt) {
      return res.status(400).json({ message: 'Test already attempted' });
    }

    // Create test attempt
    const durationInSeconds = test.duration * 60;
    const testAttempt = await TestAttempt.create({
      test: test._id,
      student: req.user._id,
      duration: durationInSeconds,
      timeRemaining: durationInSeconds,
      startedAt: new Date(),
      status: 'in-progress'
    });

    res.status(201).json(testAttempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createTest,
  getAllTests,
  getTestsByCourse,
  getAvailableTests,
  getTest,
  startTest
};
