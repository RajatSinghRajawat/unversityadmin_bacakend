const mongoose = require('mongoose');


const attendanceSchema = new mongoose.Schema({
    enrollment_id: {
      type: String,
      required: true,
      ref: 'Student', // Reference to Student model
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'half day'],
      required: true,
    },
    attendance_date: {
      type: Date,
      required: true,
    },
    in_time: {
      type: String, // store as "HH:mm" or ISO string
      default: null,
    },
    out_time: {
      type: String, // store as "HH:mm" or ISO string
      default: null,
    },
  }, {
    timestamps: true
  });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);