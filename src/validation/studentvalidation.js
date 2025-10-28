const { z } = require('zod');

// Simple student validation schema
const studentSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    address: z.string().min(5, 'Address must be at least 5 characters'),
    department: z.string().min(2, 'Department is required'),
    year: z.string().min(1, 'Year is required'),
    guardianName: z.string().min(2, 'Guardian name is required'),
    guardianPhone: z.string().min(10, 'Guardian phone is required'),
    emergencyContact: z.string().min(10, 'Emergency contact is required'),
    image: z.string().min(1, 'Image is required'),
    universityCode: z.string().min(1, 'University code is required'),
    enrollmentId: z.string().min(1, 'Enrollment ID is required'),
    JoiningDate: z.string().min(1, 'Joining date is required'),
    DateOfBirth: z.string().min(1, 'Date of birth is required'),
    Gender: z.enum(['Male', 'Female', 'Other']),
    aadharNo: z.string().min(12, 'Aadhar number must be 12 digits')
});

// Create student schema
const createStudentSchema = studentSchema;

// Update student schema (all fields optional)
const updateStudentSchema = studentSchema.partial();

// Simple validation function
const validateStudent = (data) => {
    try {
        return { success: true, data: createStudentSchema.parse(data) };
    } catch (error) {
        return { 
            success: false, 
            errors: error.errors.map(err => err.message) 
        };
    }
};

// Excel validation function
const validateExcelRow = (rowData) => {
    try {
        return { success: true, data: studentSchema.parse(rowData) };
    } catch (error) {
        return { 
            success: false, 
            errors: error.errors.map(err => err.message) 
        };
    }
};

module.exports = {
    studentSchema,
    createStudentSchema,
    updateStudentSchema,
    validateStudent,
    validateExcelRow
};