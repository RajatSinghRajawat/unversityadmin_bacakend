const { z } = require('zod');

const attendanceSchema = z.object({
    enrollment_id: z.string().min(1, 'Enrollment ID is required'),
    status: z.enum(['present', 'absent', 'half day'], {
        errorMap: () => ({ message: 'Status must be present, absent, or half day' })
    }),
    attendance_date: z.string().min(1, 'Attendance date is required'),
    in_time: z.string().optional(),
    out_time: z.string().optional()
});

const createAttendanceSchema = attendanceSchema;
const updateAttendanceSchema = attendanceSchema.partial();

const bulkAttendanceSchema = z.object({
    attendanceRecords: z.array(z.object({
        enrollment_id: z.string().min(1, 'Enrollment ID is required'),
        status: z.enum(['present', 'absent', 'half day']),
        in_time: z.string().optional(),
        out_time: z.string().optional()
    })).min(1, 'At least one attendance record is required'),
    attendance_date: z.string().min(1, 'Attendance date is required')
});

const validateAttendance = (data) => {
    try {
        return { success: true, data: createAttendanceSchema.parse(data) };
    } catch (error) {
        console.error("Attendance Validation Error:", error);

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

const validateBulkAttendance = (data) => {
    try {
        return { success: true, data: bulkAttendanceSchema.parse(data) };
    } catch (error) {
        console.error("Bulk Attendance Validation Error:", error);

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
    attendanceSchema,
    createAttendanceSchema,
    updateAttendanceSchema,
    bulkAttendanceSchema,
    validateAttendance,
    validateBulkAttendance
};
