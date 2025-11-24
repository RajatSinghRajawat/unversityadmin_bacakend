const mongoose = require('mongoose');


const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    address: [
        {
            state: {
                type: String,
                required: true
            },
            permanentAddress: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: String,
                required: true
            }


        }
    ],

    department: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        required: true
    },
    salary: {
        type: String,
        required: true
    },
    joiningDate: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    },
    experience: {
        type: String,
        required: true
    },
    emergencyContact: {
        type: String,
        required: true
    },
    universityCode: {
        type: String,
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    dateOfBirth: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    aadharNo: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    accountStatus: {
        type: String,
        required: true
    },
    accountType: {
        type: String,
        required: true
    },
    accountNumber: {
        type: String,
        required: true
    },
    accountHolderName: {
        type: String,
        required: true
    },
    accountBankName: {
        type: String,
        required: true
    },
    accountIFSCCode: {
        type: String,
        required: true
    },
    image: {
        type: String,
    },
}, {
    timestamps: true
});

module.exports =  mongoose.model('Employee', employeeSchema);