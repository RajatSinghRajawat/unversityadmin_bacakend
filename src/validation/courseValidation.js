const { z } = require('zod');

const courseSchema = z.object({
    courseName: z.string().min(2, 'Course name must be at least 2 characters'),
    courseCode: z.string().min(3, 'Course code must be at least 3 characters'),
    department: z.string().min(2, 'Department is required'),
    duration: z.string().min(1, 'Duration is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    semester: z.enum(['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th']),
    year: z.string().optional(),
    credits: z.preprocess((val) => Number(val), z.number().min(1, 'Credits must be at least 1').max(10, 'Credits cannot exceed 10')).optional(),
    instructor: z.string().min(2, 'Instructor name is required').optional(),
    courseType: z.enum(['Theory', 'Practical', 'Theory+Practical']),
    universityCode: z.enum(['GYAN001', 'GYAN002']),
    isActive: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                const lowerVal = val.toLowerCase();
                if (lowerVal === 'true' || lowerVal === '1' || lowerVal === 'yes') return true;
                if (lowerVal === 'false' || lowerVal === '0' || lowerVal === 'no') return false;
                return Boolean(val);
            }
            return val;
        },
        z.boolean().optional()
    ),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    price: z.preprocess((val) => Number(val), z.number().min(0, 'Price must be greater than or equal to 0')),
    discountPrice: z.preprocess((val) => Number(val), z.number().min(0, 'Discount price must be greater than or equal to 0')).optional(),
    bannerImage: z.string().optional()
});

const createCourseSchema = courseSchema;
const updateCourseSchema = courseSchema.partial();

const validateCourse = (data) => {
    try {
        return { success: true, data: createCourseSchema.parse(data) };
    } catch (error) {
        console.error("Validation Error:", error);

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
    courseSchema,
    createCourseSchema,
    updateCourseSchema,
    validateCourse
};
