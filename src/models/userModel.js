const mongoose = require('mongoose');




const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
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
        role:{
            type: String,
            required: true,
            enum: ['admin', 'superadmin']
        },
        status:{
            type: String,
            enum: ['active', 'inactive']
        },
    
        token:{
            type: String,
            default: ''
        },
        universityCode: {
            type: String,
            required: function () {
              return this.role !== 'superadmin'; // superadmin ke liye optional
            },
            enum: ['GYAN001', 'GYAN002'] // Static university codes
        },
        university: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'University',
            required: false // Optional for now, we'll use universityCode instead
        }
    },
    { timestamps: true }

)


module.exports =  mongoose.model('User', userSchema);