const express = require('express');
const router = express.Router();
const {
    createEmployee,
    getAllEmployees,
    getAllEmployeesSimple,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    reactivateEmployee,
    searchEmployees,
    getEmployeesByDepartment,
    getEmployeeStatistics,
    getEmployeeByEmployeeId,
    uploadEmployeesFromExcel,
    downloadEmployeeTemplate
} = require('../controllers/Employess');
const { upload, uploadExcel } = require('../../multer');

// Employee Management Routes
router.post('/create', upload.single('image'), createEmployee);
router.get('/all', getAllEmployees);
router.get('/all-simple', getAllEmployeesSimple);
router.get('/get/:id', getEmployeeById);
router.get('/employee-id/:employeeId', getEmployeeByEmployeeId);
router.put('/update/:id', upload.single('image'), updateEmployee);
router.put('/reactivate/:id', reactivateEmployee);
router.delete('/delete/:id', deleteEmployee);

// Search and Filter Routes
router.get('/search', searchEmployees);
router.get('/department', getEmployeesByDepartment);

// Statistics Routes
router.get('/statistics', getEmployeeStatistics);

// Excel Upload Routes
router.post('/upload-excel', uploadExcel.single('excel'), uploadEmployeesFromExcel);
router.get('/download-template', downloadEmployeeTemplate);

module.exports = router;
