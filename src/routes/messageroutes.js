const express = require('express');
const router = express.Router();
const {
    createMessage,
    getAllMessages,
    getStudentMessages,
    getMessageById,
    replyToMessage,
    markAsRead,
    updateMessage,
    deleteMessage,
    getMessageStats
} = require('../controllers/message');
const {
    validateCreateMessage,
    validateReplyMessage,
    validateUpdateMessage,
    validateMessageQuery
} = require('../validation/messageValidation');

// Message creation routes (no authentication required)
router.post('/create', validateCreateMessage, createMessage);

// Message retrieval routes (no authentication required)
router.get('/all',  getAllMessages); // Get all messages
router.get('/student', validateMessageQuery, getStudentMessages); // Get student messages
router.get('/stats', getMessageStats); // Get message statistics
router.get('/:id', getMessageById); // Get specific message by ID

// Message management routes (no authentication required)
router.post('/:id/reply', validateReplyMessage, replyToMessage); // Reply to a message
router.put('/:id/read', markAsRead); // Mark message as read
router.put('/:id', validateUpdateMessage, updateMessage); // Update message
router.delete('/:id', deleteMessage); // Delete message

module.exports = router;
