const { z } = require('zod');

const admitcardSchema = z.object({
    student_id: z.string().min(1, 'Student ID is required'),
    university_id: z.string().min(1, 'University ID is required'),
    course_id: z.string().min(1, 'Course ID is required'),
    semester: z.string().min(1, 'Semester is required'),
    exam_type: z.string().min(1, 'Exam type is required'),
    exam_date: z.string().min(1, 'Exam date is required'),
    exam_time: z.string().min(1, 'Exam time is required'),
    exam_center: z.string().min(1, 'Exam center is required'),
    room_no: z.string().min(1, 'Room number is required'),
    status: z.string().min(1, 'Status is required'),
    subjects: z.preprocess(
        (val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val.split(',').map(item => item.trim()).filter(item => item);
                }
            }
            return val;
        },
        z.array(z.string()).min(1, 'At least one subject is required')
    ),
    universityCode: z.enum(['GYAN001', 'GYAN002'], {
        errorMap: () => ({ message: 'Invalid university code' })
    })
});

const createAdmitcardSchema = admitcardSchema;
const updateAdmitcardSchema = admitcardSchema.partial();

const validateAdmitcard = (data) => {
    try {
        return { success: true, data: createAdmitcardSchema.parse(data) };
    } catch (error) {
        console.error("Admitcard Validation Error:", error);

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
    admitcardSchema,
    createAdmitcardSchema,
    updateAdmitcardSchema,
    validateAdmitcard
};
