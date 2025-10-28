const express = require('express');
const router = express.Router();
const {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession,
    getDefaultSession,
    setDefaultSession,
    getSessionByYear,
    getRecentSessions,
    getSessionStatistics
} = require('../controllers/session');

// Session Management Routes
router.post('/create', createSession);
router.get('/all', getAllSessions);
router.get('/get/:id', getSessionById);
router.get('/year/:year', getSessionByYear);
router.put('/update/:id', updateSession);
router.delete('/delete/:id', deleteSession);

// Default Session Routes
router.get('/default', getDefaultSession);
router.put('/set-default/:id', setDefaultSession);

// Utility Routes
router.get('/recent', getRecentSessions);
router.get('/statistics', getSessionStatistics);

module.exports = router;
