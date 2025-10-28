const mongoose = require('mongoose');



const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    year: {
        type: String,
        required: true
    },
    guardianName: {
        type: String,
        required: true
    },
    guardianPhone: {
        type: String,
        required: true
    },
    emergencyContact: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    universityCode: {
        type: String,
        required: true
    },
    enrollmentId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactive']
    },
    JoiningDate:{
        type: String,
        required: true
    },
    DateOfBirth:{
        type: String,
        required: true
    },
    Gender:{
        type: String,
        required: true,
        enum: ['Male', 'Female', 'Other']
    },
    aadharNo:{
        type: String,
        required: true
    },
    course_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session',
        default: null
    },
    count_emi: {
        type: Number,
        required: false, // equivalent to allowNull: true
      },
      discount_amount: {
        type: Number,
        required: false, // FLOAT in SQL = Number in Mongo
      },
      final_amount: {
        type: Number,
        required: false,
        default: 0, // defaultValue: 0
      },
      invoice_status: {
        type: String,
        required: false,
      },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Student || mongoose.model('Student', studentSchema);