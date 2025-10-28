const express = require('express');
const router = express.Router();
const {
    createStudent,
    getAllStudents,
    getStudentById,
    getStudentByEmailOrPassword,
    updateStudent,
    deleteStudent,
    searchStudents,
    getExStudents,
    reactivateStudent,
    uploadStudentsFromExcel
} = require('../controllers/StudentController');
const { upload, uploadExcel } = require('../../multer');

// Simple routes without complex validation middleware
router.post('/create', upload.array("image"), createStudent);
router.get('/all', getAllStudents);
router.get('/search', searchStudents);
router.get('/get/:id', getStudentById);
router.get('/search-email-password', getStudentByEmailOrPassword);
router.put('/update/:id', upload.array("image"), updateStudent);
router.put('/reactivate/:id', reactivateStudent);
router.delete('/delete/:id', deleteStudent);
router.get('/ex-students', getExStudents);
router.post('/upload-excel', uploadExcel.single('excel'), uploadStudentsFromExcel);



module.exports = router;