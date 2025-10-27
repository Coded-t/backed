const TestAttempt = require('../models/TestAttempt');
const Test = require('../models/Test');
const gradeTest = require('../utils/gradeTest');

// @desc    Submit test answers
// @route   POST /api/results/attempt/:attemptId/submit
// @access  Private/Student
const submitTest = async (req, res) => {
  try {
    const { answers } = req.body;
    const attempt = await TestAttempt.findById(req.params.attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if this attempt belongs to the student
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to submit this test' });
    }

    if (attempt.status === 'submitted') {
      return res.status(400).json({ message: 'Test already submitted' });
    }

    attempt.answers = answers;
    attempt.submittedAt = new Date();
    attempt.status = 'submitted';
    
    // Calculate time remaining
    const timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);
    attempt.timeRemaining = Math.max(0, attempt.duration - timeSpent);
    
    await attempt.save();

    // Auto-grade the test
    const test = await Test.findById(attempt.test);
    const gradedAttempt = gradeTest(attempt, test);
    
    // Update attempt with grades
    attempt.answers = gradedAttempt.answers;
    attempt.score = gradedAttempt.score;
    attempt.percentage = gradedAttempt.percentage;
    attempt.totalPoints = gradedAttempt.totalPoints;
    attempt.status = 'graded';
    
    await attempt.save();

    res.json(attempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Save answer during test
// @route   PUT /api/results/attempt/:attemptId/answer
// @access  Private/Student
const saveAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const attempt = await TestAttempt.findById(req.params.attemptId);
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if this attempt belongs to the student
    if (attempt.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to save answers for this test' });
    }

    const existingAnswerIndex = attempt.answers.findIndex(
      a => a.questionId.toString() === questionId
    );

    if (existingAnswerIndex >= 0) {
      attempt.answers[existingAnswerIndex].answer = answer;
    } else {
      attempt.answers.push({ questionId, answer });
    }

    await attempt.save();
    res.json(attempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get attempt details
// @route   GET /api/results/attempt/:attemptId
// @access  Private
const getAttempt = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('test', 'title duration teacher')
      .populate('student', 'name matricNumber');

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    // Check authorization
    const { role, _id: userId } = req.user;
    
    if (role === 'student' && attempt.student._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this attempt' });
    }

    if (role === 'teacher' && attempt.test.teacher.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this attempt' });
    }

    // For students, check if result is published
    if (role === 'student' && !attempt.resultPublished && attempt.status === 'graded') {
      attempt.score = undefined;
      attempt.percentage = undefined;
      attempt.answers = attempt.answers.map(ans => ({
        ...ans,
        isCorrect: undefined,
        explanation: undefined
      }));
    }

    res.json(attempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get student results
// @route   GET /api/results/my-results
// @access  Private/Student
const getMyResults = async (req, res) => {
  try {
    const attempts = await TestAttempt.find({ student: req.user._id })
      .populate('test', 'title')
      .populate({
        path: 'test',
        populate: { path: 'course', select: 'courseCode courseTitle' }
      })
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Publish results after delay
// @route   POST /api/results/publish/:attemptId
// @access  Private/Teacher
const publishResult = async (req, res) => {
  try {
    const attempt = await TestAttempt.findById(req.params.attemptId)
      .populate('test', 'teacher');
    
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }
    
    // Check if this test belongs to the teacher
    if (attempt.test.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to publish results for this test' });
    }

    attempt.resultPublished = true;
    attempt.resultPublishedAt = new Date();
    await attempt.save();

    res.json(attempt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Auto-submit expired tests
// @route   POST /api/results/auto-submit
// @access  Public
const autoSubmitExpiredTests = async (req, res) => {
  try {
    const now = new Date();
    
    // Find all in-progress tests that have exceeded their duration
    const expiredAttempts = await TestAttempt.find({
      status: 'in-progress',
      startedAt: { $lt: new Date(now.getTime() - 60 * 60 * 1000) } // Started more than 1 hour ago
    }).populate('test');

    for (const attempt of expiredAttempts) {
      const timeSpent = Math.floor((now - attempt.startedAt) / 1000);
      const timeRemaining = Math.max(0, attempt.duration - timeSpent);
      
      if (timeRemaining <= 0 || timeSpent >= attempt.duration) {
        attempt.status = 'submitted';
        attempt.submittedAt = now;
        attempt.autoSubmitted = true;
        attempt.timeRemaining = 0;
        
        // Auto-grade if answers exist
        if (attempt.answers && attempt.answers.length > 0) {
          const gradedAttempt = gradeTest(attempt, attempt.test);
          attempt.answers = gradedAttempt.answers;
          attempt.score = gradedAttempt.score;
          attempt.percentage = gradedAttempt.percentage;
          attempt.totalPoints = gradedAttempt.totalPoints;
          attempt.status = 'graded';
        }
        
        await attempt.save();
      }
    }

    res.json({ message: 'Auto-submission completed', count: expiredAttempts.length });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get results for a teacher's tests
// @route   GET /api/results/test/:testId
// @access  Private/Teacher
const getTestResults = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId);
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if this test belongs to the teacher
    if (test.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view results for this test' });
    }

    const attempts = await TestAttempt.find({ test: req.params.testId })
      .populate('student', 'name matricNumber')
      .select('student startedAt submittedAt score percentage status resultPublished')
      .sort('-startedAt');

    res.json(attempts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  submitTest,
  saveAnswer,
  getAttempt,
  getMyResults,
  publishResult,
  autoSubmitExpiredTests,
  getTestResults
};
