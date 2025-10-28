const express = require('express');
const router = express.Router();
const {
    createAdmitcard,
    getAllAdmitcards,
    getAdmitcardById,
    updateAdmitcard,
    deleteAdmitcard,
    getAdmitcardsByStudent,
    getAdmitcardsByCourse,
    searchAdmitcards,
    getUpcomingExams
} = require('../controllers/admitcard');

// Admitcard Management Routes
router.post('/create', createAdmitcard);
router.get('/all', getAllAdmitcards);
router.get('/get/:id', getAdmitcardById);
router.put('/update/:id', updateAdmitcard);
router.delete('/delete/:id', deleteAdmitcard);

// Search and Filter Routes
router.get('/search', searchAdmitcards);
router.get('/upcoming', getUpcomingExams);

// Related Data Routes
router.get('/student/:studentId', getAdmitcardsByStudent);
router.get('/course/:courseId', getAdmitcardsByCourse);

module.exports = router;
