const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    courseName: {
        type: String,
        required: true,
        trim: true
    },
    courseCode: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    department: {
        type: String,
        required: true,
        trim: true
    },
    duration: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    semester: {
        type: String,
        required: true,
        enum: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']
    },
    year: {
        type: String,
    },
    credits: {
        type: Number,
        min: 1,
        max: 10,
        default: 3
    },
    instructor: {
        type: String,
        trim: true,
        default: 'TBD'
    },
    courseType: {
        type: String,
        required: true,
        enum: ['Theory', 'Practical', 'Theory+Practical']
    },
    universityCode: {
        type: String,
        required: true,
        enum: ['GYAN001', 'GYAN002']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    startDate: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
        required: true
    },
   
    price: {
        type: Number,
        required: true,
        min: 0
    },
    discountPrice: {
        type: Number,
        min: 0,
        default: 0
    },
    bannerImage: {
        type: String,
        default: ''
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student'
    }],
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
courseSchema.index({ courseCode: 1, universityCode: 1 });
courseSchema.index({ department: 1, universityCode: 1 });

module.exports = mongoose.models.Course || mongoose.model('Course', courseSchema);
