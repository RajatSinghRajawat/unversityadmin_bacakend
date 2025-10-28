const mongoose = require('mongoose');


const messageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: false
    },
    universityCode: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['general', 'complaint', 'query', 'feedback', 'urgent'],
        default: 'general'
    },
    read: {
        type: Boolean,
        default: false
    },
    sender_id: {
        type: String,
        required: true
    },
    sender_role: {
        type: String,
        required: true,
        enum: ['admin', 'student', 'superadmin']
    },
    sender_name: {
        type: String,
        required: false,
        trim: true,
        maxlength: 100
    },
    replies: [{
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },
        sender_id: {
            type: String,
            required: true
        },
        sender_role: {
            type: String,
            required: true,
            enum: ['admin', 'student', 'superadmin']
        },
        sender_name: {
            type: String,
            required: false,
            trim: true,
            maxlength: 100
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
})

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
