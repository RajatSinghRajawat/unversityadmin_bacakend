const { z } = require('zod');

const addressSchema = z.object({
    state: z.string().min(1, 'State is required'),
    permanentAddress: z.string().min(1, 'Permanent address is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(6, 'Pincode must be at least 6 characters').max(6, 'Pincode must be exactly 6 characters')
});

const employeeSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number cannot exceed 15 digits'),
    address: z.array(addressSchema).min(1, 'At least one address is required'),
    department: z.string().min(1, 'Department is required'),
    designation: z.string().min(1, 'Designation is required'),
    salary: z.string().min(1, 'Salary is required'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    qualification: z.string().min(1, 'Qualification is required'),
    experience: z.string().min(1, 'Experience is required'),
    emergencyContact: z.string().min(10, 'Emergency contact must be at least 10 digits'),
    image: z.string().optional(),
    universityCode: z.enum(['GYAN001', 'GYAN002'], {
        errorMap: () => ({ message: 'Invalid university code' })
    }),
    employeeId: z.string().min(1, 'Employee ID is required'),
    status: z.string().min(1, 'Status is required'),
    dateOfBirth: z.string().min(1, 'Date of birth is required'),
    gender: z.enum(['Male', 'Female', 'Other'], {
        errorMap: () => ({ message: 'Gender must be Male, Female, or Other' })
    }),
    aadharNo: z.string().min(12, 'Aadhar number must be 12 digits').max(12, 'Aadhar number must be 12 digits'),
    isActive: z.boolean().default(true),
    accountStatus: z.string().min(1, 'Account status is required'),
    accountType: z.string().min(1, 'Account type is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    accountHolderName: z.string().min(1, 'Account holder name is required'),
    accountBankName: z.string().min(1, 'Bank name is required'),
    accountIFSCCode: z.string().min(1, 'IFSC code is required')
});

const createEmployeeSchema = employeeSchema;
const updateEmployeeSchema = employeeSchema.partial();

const validateEmployee = (data) => {
    try {
        return { success: true, data: createEmployeeSchema.parse(data) };
    } catch (error) {
        console.error("Employee Validation Error:", error);

        if (error.errors && Array.isArray(error.errors)) {
            return {
                success: false,
                errors: error.errors.map(err => err.message)
            };
        }

        return {
            success: false,
            errors: [error.message || 'Unexpected validation error']
        };
    }
};

module.exports = {
    employeeSchema,
    createEmployeeSchema,
    updateEmployeeSchema,
    validateEmployee
};
