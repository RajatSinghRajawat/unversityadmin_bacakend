const mongoose = require('mongoose');
const Message = require('../models/message');
const Student = require('../models/StudentModel');
const { getUniversityByCode } = require('../config/universityConfig');

// Create a new message
const createMessage = async (req, res) => {
    try {
        const { title, message, student_id, type, sender_role, sender_name, sender_id, universityCode } = req.body;

        // Validate required fields
        if (!title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        // Validate message type
        const validTypes = ['general', 'complaint', 'query', 'feedback', 'urgent'];
        if (!type || !validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Valid message type is required',
                validTypes
            });
        }

        // Validate sender role
        const validRoles = ['admin', 'student', 'superadmin'];
        if (!sender_role || !validRoles.includes(sender_role)) {
            return res.status(400).json({
                success: false,
                message: 'Valid sender role is required',
                validRoles
            });
        }

        // If student_id is provided and it's a valid ObjectId, validate it exists
        if (student_id && mongoose.Types.ObjectId.isValid(student_id)) {
            const student = await Student.findById(student_id);
            if (!student) {
                return res.status(400).json({
                    success: false,
                    message: 'Student not found'
                });
            }
        }

        // Determine sender_id: use provided sender_id, or fallback to student_id, or use admin ID
        let finalSenderId = sender_id;
        
        if (!finalSenderId) {
            if (sender_role === 'student') {
                // For students, use student_id as string if provided, or generate a default
                finalSenderId = student_id ? String(student_id) : 'student_' + Date.now();
            } else {
                // For admin/superadmin, use default admin ID
                finalSenderId = 'admin123';
            }
        }

        // Create message data
        const messageData = {
            title,
            message,
            student_id: (student_id && mongoose.Types.ObjectId.isValid(student_id)) ? student_id : null,
            universityCode: universityCode || 'GYAN001', // Default university code
            date: new Date().toISOString(),
            type,
            sender_id: finalSenderId,
            sender_role,
            sender_name: sender_name || (sender_role === 'student' ? 'Student' : 'Administration'),
            read: false
        };

        const newMessage = await Message.create(messageData);

        // Populate student information if student_id exists
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('student_id', 'name email phone rollNumber')
            .populate('replies.sender_id', 'name email role');

        return res.status(201).json({
            success: true,
            message: 'Message created successfully',
            data: populatedMessage
        });

    } catch (error) {
        console.error('Create message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get all messages (no authentication required)
const getAllMessages = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, read, student_id, universityCode } = req.query;

        // Build filter object
        let filter = {};

        // Apply filters
        if (type) filter.type = type;
        if (read !== undefined) filter.read = read === 'true';
        if (student_id) filter.student_id = student_id;
        if (universityCode) filter.universityCode = universityCode;

        const messages = await Message.find(filter)
            .populate('student_id', 'name email phone rollNumber course_id')
            .populate('replies.sender_id', 'name email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Message.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get all messages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get messages for a specific student (optimized for student view)
const getStudentMessages = async (req, res) => {
    try {
        const { page = 1, limit = 10, type, read, student_id, email, universityCode } = req.query;

        // If email is provided, find the student first
        let studentId = student_id;
        if (email && !student_id) {
            const Student = require('../models/StudentModel');
            const student = await Student.findOne({ email: email, universityCode: universityCode });
            if (student) {
                studentId = student._id;
            }
        }

        // Build filter object for student messages
        // Students can see:
        // 1. Messages they sent (sender_role = student)
        // 2. Admin messages sent to them (sender_role = admin, student_id = their ID)
        // 3. Admin broadcast messages (sender_role = admin, student_id = null)
        
        // Build base filter
        let filter = {
            universityCode: universityCode
        };
        
        // Build OR conditions for different message types student can see
        filter.$or = [
            // All admin messages (students can see all admin messages)
            { sender_role: 'admin' },
            // Messages sent by students (students can see all student messages)
            { sender_role: 'student' }
        ];

        // Apply additional filters
        if (type) {
            // If type filter exists, apply it to all OR conditions
            const orConditions = filter.$or.map(condition => ({
                ...condition,
                type: type
            }));
            filter.$or = orConditions;
        }
        if (read !== undefined) {
            const orConditions = filter.$or.map(condition => ({
                ...condition,
                read: read === 'true'
            }));
            filter.$or = orConditions;
        }

        const messages = await Message.find(filter)
            .populate('student_id', 'name email phone rollNumber')
            .populate('replies.sender_id', 'name email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Message.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: messages,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalMessages: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get student messages error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get a single message by ID (no authentication required)
const getMessageById = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id)
            .populate('student_id', 'name email phone rollNumber course_id')
            .populate('replies.sender_id', 'name email role');

        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: message
        });

    } catch (error) {
        console.error('Get message by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Reply to a message (no authentication required)
const replyToMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply, sender_role, sender_name, sender_id } = req.body;

        if (!reply || reply.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Reply message is required'
            });
        }

        // Validate sender role
        const validRoles = ['admin', 'student', 'superadmin'];
        if (!sender_role || !validRoles.includes(sender_role)) {
            return res.status(400).json({
                success: false,
                message: 'Valid sender role is required',
                validRoles
            });
        }

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Determine sender_id for the reply
        let finalSenderId = sender_id;
        if (!finalSenderId) {
            if (sender_role === 'student') {
                // For students, generate a default ID or use from message
                finalSenderId = message.student_id ? String(message.student_id) : 'student_' + Date.now();
            } else {
                // For admin/superadmin, use default admin ID
                finalSenderId = 'admin123';
            }
        }

        // Add reply to the message
        const replyData = {
            message: reply.trim(),
            sender_id: finalSenderId,
            sender_role,
            sender_name: sender_name || (sender_role === 'student' ? 'Student' : 'Administration'),
            timestamp: new Date()
        };

        message.replies = message.replies || [];
        message.replies.push(replyData);

        // Mark original message as read
        message.read = true;

        await message.save();

        // Populate and return updated message
        const updatedMessage = await Message.findById(id)
            .populate('student_id', 'name email phone rollNumber')
            .populate('replies.sender_id', 'name email role');

        return res.status(200).json({
            success: true,
            message: 'Reply sent successfully',
            data: updatedMessage
        });

    } catch (error) {
        console.error('Reply to message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Mark message as read (no authentication required)
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        message.read = true;
        await message.save();

        return res.status(200).json({
            success: true,
            message: 'Message marked as read'
        });

    } catch (error) {
        console.error('Mark as read error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Update message (no authentication required)
const updateMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message: messageText, type } = req.body;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        // Update fields
        if (title) message.title = title;
        if (messageText) message.message = messageText;
        if (type) message.type = type;

        await message.save();

        const updatedMessage = await Message.findById(id)
            .populate('student_id', 'name email phone rollNumber')
            .populate('replies.sender_id', 'name email role');

        return res.status(200).json({
            success: true,
            message: 'Message updated successfully',
            data: updatedMessage
        });

    } catch (error) {
        console.error('Update message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Delete message (no authentication required)
const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;

        const message = await Message.findById(id);
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found'
            });
        }

        await Message.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Message deleted successfully'
        });

    } catch (error) {
        console.error('Delete message error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get message statistics (no authentication required)
const getMessageStats = async (req, res) => {
    try {
        const { universityCode } = req.query;
        const filter = universityCode ? { universityCode } : {};

        const totalMessages = await Message.countDocuments(filter);
        const unreadMessages = await Message.countDocuments({ ...filter, read: false });
        const messagesByType = await Message.aggregate([
            { $match: filter },
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        const recentMessages = await Message.find(filter)
            .populate('student_id', 'name email rollNumber')
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,
            data: {
                totalMessages,
                unreadMessages,
                readMessages: totalMessages - unreadMessages,
                messagesByType,
                recentMessages
            }
        });

    } catch (error) {
        console.error('Get message stats error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createMessage,
    getAllMessages,
    getStudentMessages,
    getMessageById,
    replyToMessage,
    markAsRead,
    updateMessage,
    deleteMessage,
    getMessageStats
};
