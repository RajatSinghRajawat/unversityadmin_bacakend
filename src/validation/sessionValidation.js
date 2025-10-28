const { z } = require('zod');

const sessionSchema = z.object({
    session_year: z.preprocess(
        (val) => Number(val),
        z.number()
            .int('Session year must be an integer')
            .min(2000, 'Session year must be at least 2000')
            .max(new Date().getFullYear() + 5, `Session year cannot exceed ${new Date().getFullYear() + 5}`)
    ),
    is_default: z.boolean().default(false)
});

const createSessionSchema = sessionSchema;
const updateSessionSchema = sessionSchema.partial();

const validateSession = (data) => {
    try {
        return { success: true, data: createSessionSchema.parse(data) };
    } catch (error) {
        console.error("Session Validation Error:", error);

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
    sessionSchema,
    createSessionSchema,
    updateSessionSchema,
    validateSession
};
