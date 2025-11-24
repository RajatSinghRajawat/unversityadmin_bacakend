const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  session_year: {
    type: Number,
    required: true,
    min: 2000
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  is_default: {
    type: Boolean,
    required: true,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'upcoming'],
    default: 'active'
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  totalCourses: {
    type: Number,
    default: 0
  },
  totalFaculty: {
    type: Number,
    default: 0
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student'
  }],
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  universityCode: {
    type: String,
    required: true,
    enum: ['GYAN001', 'GYAN002']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Session', sessionSchema);
