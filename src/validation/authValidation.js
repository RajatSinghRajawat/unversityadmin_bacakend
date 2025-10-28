const { z } = require('zod');

// Simple auth validation schemas
const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'superadmin']),
    universityCode: z.string().optional()
});

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    universityCode: z.string().optional()
});

// Simple validation functions
const validateRegister = (data) => {
    try {
        return { success: true, data: registerSchema.parse(data) };
    } catch (error) {
        return { 
            success: false, 
            errors: error.errors.map(err => err.message) 
        };
    }
};

const validateLogin = (data) => {
    try {
        return { success: true, data: loginSchema.parse(data) };
    } catch (error) {
        return { 
            success: false, 
            errors: error.errors.map(err => err.message) 
        };
    }
};

module.exports = {
    registerSchema,
    loginSchema,
    validateRegister,
    validateLogin
};