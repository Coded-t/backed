const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  answer: {
    type: mongoose.Schema.Types.Mixed, // Can be string or array
    required: true
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  isCorrect: {
    type: Boolean,
    default: false
  },
  timeSpent: Number // in seconds
});

const testAttemptSchema = new mongoose.Schema({
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [answerSchema],
  startedAt: {
    type: Date,
    required: true
  },
  submittedAt: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    required: true
  },
  timeRemaining: {
    type: Number, // in seconds
    default: 0
  },
  autoSubmitted: {
    type: Boolean,
    default: false
  },
  score: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'graded'],
    default: 'in-progress'
  },
  resultPublished: {
    type: Boolean,
    default: false
  },
  resultPublishedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
testAttemptSchema.index({ test: 1, student: 1 });

module.exports = mongoose.model('TestAttempt', testAttemptSchema);
