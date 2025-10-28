const express = require('express');
const router = express.Router();
const {
    createAttendance,
    getAllAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    getAttendanceByStudent,
    getAttendanceStatistics,
    getStudentAttendanceSummary,
    bulkMarkAttendance
} = require('../controllers/Attendence');

// Attendance Management Routes
router.post('/create', createAttendance);
router.get('/all', getAllAttendance);
router.get('/get/:id', getAttendanceById);
router.put('/update/:id', updateAttendance);
router.delete('/delete/:id', deleteAttendance);

// Bulk Operations
router.post('/bulk-mark', bulkMarkAttendance);

// Student Attendance Routes
router.get('/student/:enrollmentId', getAttendanceByStudent);
router.get('/student/:enrollmentId/summary', getStudentAttendanceSummary);

// Reporting and Statistics Routes
router.get('/statistics', getAttendanceStatistics);

module.exports = router;
