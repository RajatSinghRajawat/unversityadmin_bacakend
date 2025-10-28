// const express = require('express');
// const router = express.Router();
// const {
//     createPayment,
//     getAllPayments,
//     getPaymentById,
//     updatePayment,
//     deletePayment,
//     markPaymentAsPaid,
//     getPaymentsByStudent,
//     getOverduePayments,
//     getPaymentStatistics
// } = require('../controllers/Accounts');

// // Payment Management Routes
// router.post('/create', createPayment);
// router.get('/all', getAllPayments);
// router.get('/get/:id', getPaymentById);
// router.put('/update/:id', updatePayment);
// router.delete('/delete/:id', deletePayment);

// // Payment Status Routes
// router.put('/mark-paid/:id', markPaymentAsPaid);

// // Student Payment Routes
// router.get('/student/:studentId', getPaymentsByStudent);

// // Reporting Routes
// router.get('/overdue', getOverduePayments);
// router.get('/statistics', getPaymentStatistics);

// module.exports = router;



const express = require('express');
const router = express.Router();
const {
    addPayments,
    addOneShotPayment,
    getPayments,
    markPaymentAsPaid,
    getOneStudentPaymentHistory
} = require('../controllers/Accounts');
const { validateUniversityCode, addUniversityFilter } = require('../middlewares/universityMiddleware');

// Payment Management Routes
router.post('/add-payment', validateUniversityCode, addPayments);
router.post('/add-one-shot-payment', validateUniversityCode, addOneShotPayment);

// Payment Retrieval Routes
router.get('/all', addUniversityFilter, getPayments);
router.get('/student/:id', addUniversityFilter, getOneStudentPaymentHistory);

// Payment Status Management Routes
router.put('/mark-paid/:id', markPaymentAsPaid);

module.exports = router;