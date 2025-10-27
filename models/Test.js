const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'dropdown', 'checkbox', 'written'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean,
    points: { type: Number, default: 0 }
  }],
  correctAnswer: {
    type: mongoose.Schema.Types.Mixed // Can be string or array
  },
  points: {
    type: Number,
    default: 1
  },
  order: Number
});

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questions: [questionSchema],
  duration: {
    type: Number,
    required: true, // Duration in minutes
    min: 1
  },
  availableFrom: {
    type: Date,
    required: true
  },
  availableUntil: {
    type: Date,
    required: true
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
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

// Calculate total points before saving
testSchema.pre('save', function(next) {
  this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0);
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Test', testSchema);
