const mongoose = require('mongoose');


const admitcardSchema = new mongoose.Schema({
  student_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  exam_type: {
    type: String,
    required: true
  },
  exam_date: {
    type: String,
    required: false  // Made optional since subjects now have individual dates
  },
  exam_time: {
    type: String,
    required: false  // Made optional since subjects now have individual times
  },
  exam_center: {
    type: String,
    required: true
  },
  room_no: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  subjects: {
    type: [{
      subjectName: {
        type: String,
        required: true
      },
      examDate: {
        type: String,
        required: true
      },
      examStartTime: {
        type: String,
        required: true
      },
      examEndTime: {
        type: String,
        required: true
      },
      roomNo: {
        type: String,
        required: false
      }
    }],
    required: true
  },
  universityCode: {
    type: String,
    required: true
  },
  
}, {
  timestamps: true
});

module.exports =  mongoose.model('Admitcard', admitcardSchema);