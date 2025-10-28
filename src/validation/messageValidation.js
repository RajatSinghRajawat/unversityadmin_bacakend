const { z } = require('zod');

// Validation schema for creating a message
const createMessageSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters'),
    
    message: z.string()
        .trim()
        .min(1, 'Message content is required')
        .max(1000, 'Message cannot exceed 1000 characters'),
    
    student_id: z.string()
        .optional(),
    
    type: z.enum(['general', 'complaint', 'query', 'feedback', 'urgent'])
        .default('general'),
    
    sender_role: z.enum(['admin', 'student', 'superadmin'])
        .default('student'),
    
    sender_name: z.string()
        .trim()
        .max(100, 'Sender name cannot exceed 100 characters')
        .optional(),
    
    sender_id: z.string()
        .optional(),
    
    universityCode: z.string()
        .trim()
        .max(20, 'University code cannot exceed 20 characters')
        .optional()
});

// Validation schema for replying to a message
const replyMessageSchema = z.object({
    reply: z.string()
        .trim()
        .min(1, 'Reply message is required')
        .max(1000, 'Reply cannot exceed 1000 characters'),
    
    sender_role: z.enum(['admin', 'student', 'superadmin'])
        .default('admin'),
    
    sender_name: z.string()
        .trim()
        .max(100, 'Sender name cannot exceed 100 characters')
        .optional(),
    
    sender_id: z.string()
        .optional()
});

// Validation schema for updating a message
const updateMessageSchema = z.object({
    title: z.string()
        .trim()
        .min(1, 'Title cannot be empty')
        .max(200, 'Title cannot exceed 200 characters')
        .optional(),
    
    message: z.string()
        .trim()
        .min(1, 'Message content cannot be empty')
        .max(1000, 'Message cannot exceed 1000 characters')
        .optional(),
    
    type: z.enum(['general', 'complaint', 'query', 'feedback', 'urgent'])
        .optional()
});

// Validation schema for query parameters
const messageQuerySchema = z.object({
    page: z.coerce.number()
        .int('Page must be an integer')
        .min(1, 'Page must be at least 1')
        .default(1),
    
    limit: z.coerce.number()
        .int('Limit must be an integer')
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(10),
    
    type: z.enum(['general', 'complaint', 'query', 'feedback', 'urgent'])
        .optional(),
    
    read: z.enum(['true', 'false'])
        .optional(),
    
    student_id: z.string()
        .optional(),
    
    universityCode: z.string()
        .trim()
        .max(20, 'University code cannot exceed 20 characters')
        .optional()
});

// Validation middleware functions
const validateCreateMessage = (req, res, next) => {
    try {
        const validatedData = createMessageSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors ? error.errors.map(err => err.message) : ['Validation failed']
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const validateReplyMessage = (req, res, next) => {
    try {
        const validatedData = replyMessageSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors ? error.errors.map(err => err.message) : ['Validation failed']
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const validateUpdateMessage = (req, res, next) => {
    try {
        const validatedData = updateMessageSchema.parse(req.body);
        req.body = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.errors ? error.errors.map(err => err.message) : ['Validation failed']
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

const validateMessageQuery = (req, res, next) => {
    try {
        const validatedData = messageQuerySchema.parse(req.query);
        req.query = validatedData;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                message: 'Query validation error',
                errors: error.errors ? error.errors.map(err => err.message) : ['Validation failed']
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    validateCreateMessage,
    validateReplyMessage,
    validateUpdateMessage,
    validateMessageQuery,
    createMessageSchema,
    replyMessageSchema,
    updateMessageSchema,
    messageQuerySchema
};
