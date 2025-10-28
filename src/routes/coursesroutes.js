const express = require('express');
const router = express.Router();
const {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    searchCourses,
    getCoursesByDepartment,
    getCoursesBySemester
} = require('../controllers/CoursesController');
const { upload } = require('../../multer');

// Simple routes with file upload support for banner images
router.post('/create', upload.array("bannerImage",1), createCourse);
router.get('/all', getAllCourses);
router.get('/search', searchCourses);
router.get('/get/:id', getCourseById);
router.put('/update/:id', upload.array("bannerImage", 1), updateCourse);
router.delete('/delete/:id', deleteCourse);
router.get('/department', getCoursesByDepartment);
router.get('/semester', getCoursesBySemester);

module.exports = router;
