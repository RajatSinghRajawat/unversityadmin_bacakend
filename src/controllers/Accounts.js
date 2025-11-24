const Student = require('../models/students');
const Payment = require("../models/Accounts");
const { getUniversityByCode } = require('../config/universityConfig');

// ----------------- ADD MULTIPLE EMIS -----------------
exports.addPayments = async (req, res) => {
  try {
    const { student_id, amount, emi_discount = 0, emi_frequency, universityCode, manualJoiningDate } = req.body;

    // Validate required fields for multiple EMI payments
    if (!student_id || !amount || !emi_frequency || !universityCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: student_id, amount, emi_frequency, universityCode" 
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount must be a positive number" 
      });
    }

    // Validate university code
    if (!getUniversityByCode(universityCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid university code" 
      });
    }

    // Validate EMI frequency
    const validFrequencies = ['monthly', 'quarterly', 'semester', 'yearly'];
    if (!validFrequencies.includes(emi_frequency)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid EMI frequency. Must be one of: monthly, quarterly, semester, yearly" 
      });
    }

    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }
    
    if (student.status === "inactive") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot create EMI for inactive student" 
      });
    }

    // Check if student belongs to the same university
    if (student.universityCode !== universityCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Student does not belong to the specified university" 
      });
    }

    const existingPayment = await Payment.findOne({ student_id });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: "EMI already exists for this student" 
      });
    }

    // Get course duration from student's course
    const courseDuration = student.course_id?.duration || 12; // Default to 12 months
    
    // Calculate number of EMIs based on frequency
    let emi_number;
    switch (emi_frequency) {
      case 'monthly':
        emi_number = courseDuration;
        break;
      case 'quarterly':
        emi_number = Math.ceil(courseDuration / 3);
        break;
      case 'semester':
        emi_number = Math.ceil(courseDuration / 6);
        break;
      case 'yearly':
        emi_number = Math.ceil(courseDuration / 12);
        break;
      default:
        emi_number = courseDuration;
    }

    // Validate and set start date to student's joining date
    // Check multiple possible field names for joining date
    let joiningDate = manualJoiningDate || student.joiningDate || student.joining_date || student.JoiningDate || student.dateOfJoining || student.admissionDate;
    
    // If no joining date found, use current date as fallback
    if (!joiningDate) {
      joiningDate = new Date();
      console.log(`Warning: No joining date found for student ${student._id}, using current date as fallback`);
    }
    
    const start_date = new Date(joiningDate);
    if (isNaN(start_date.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid student joining date: ${joiningDate}. Please ensure the student has a valid joining date. Available fields: ${JSON.stringify(Object.keys(student))}` 
      });
    }
    
    console.log(`Student joining date: ${joiningDate}, Parsed date: ${start_date}`);

    // For EMI calculations, we need to ensure the joining date is reasonable
    // Allow future dates for new students but not too far in the future
    const today = new Date();
    const maxFutureDate = new Date();
    maxFutureDate.setFullYear(today.getFullYear() + 2); // Allow up to 2 years in future
    
    if (start_date > maxFutureDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Student joining date cannot be more than 2 years in the future" 
      });
    }
    
    // Calculate end date based on EMI frequency and number
    let end_date = new Date(start_date);
    switch (emi_frequency) {
      case 'monthly':
        end_date.setMonth(start_date.getMonth() + emi_number);
        break;
      case 'quarterly':
        end_date.setMonth(start_date.getMonth() + (emi_number * 3));
        break;
      case 'semester':
        end_date.setMonth(start_date.getMonth() + (emi_number * 6));
        break;
      case 'yearly':
        end_date.setFullYear(start_date.getFullYear() + emi_number);
        break;
    }

    const netAmount = amount - emi_discount;
    const emiAmount = Math.ceil(netAmount / emi_number);
    const emiList = [];

    // Calculate EMI due dates with proper logic
    for (let i = 0; i < emi_number; i++) {
      const emiDueDate = new Date(start_date);
      
      // Calculate due date based on frequency
      // For future joining dates, first EMI can be due from joining date or next month
      const isFutureJoining = start_date > new Date();
      
      switch (emi_frequency) {
        case 'monthly':
          if (isFutureJoining) {
            // If joining date is in future, first EMI due from joining date
            emiDueDate.setMonth(start_date.getMonth() + i);
          } else {
            // If joining date is past, first EMI due next month
            emiDueDate.setMonth(start_date.getMonth() + i + 1);
          }
          break;
        case 'quarterly':
          if (isFutureJoining) {
            emiDueDate.setMonth(start_date.getMonth() + (i * 3));
          } else {
            emiDueDate.setMonth(start_date.getMonth() + ((i + 1) * 3));
          }
          break;
        case 'semester':
          if (isFutureJoining) {
            emiDueDate.setMonth(start_date.getMonth() + (i * 6));
          } else {
            emiDueDate.setMonth(start_date.getMonth() + ((i + 1) * 6));
          }
          break;
        case 'yearly':
          if (isFutureJoining) {
            emiDueDate.setFullYear(start_date.getFullYear() + i);
          } else {
            emiDueDate.setFullYear(start_date.getFullYear() + (i + 1));
          }
          break;
      }

      // Ensure the date is valid
      if (isNaN(emiDueDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: `Failed to calculate EMI due date for installment ${i + 1}` 
        });
      }

      emiList.push({
        student_id,
        is_paid: false,
        amount: emiAmount,
        emi_discount: parseFloat(emi_discount || 0),
        emi_duedate: emiDueDate,
        universityCode,
      });
    }

    const createdPayments = await Payment.insertMany(emiList);

    await Student.findByIdAndUpdate(student_id, {
      count_emi: emi_number,
      discount_amount: emi_discount,
      final_amount: netAmount,
    });

    // Create EMI schedule for response
    const emiSchedule = createdPayments.map((payment, index) => ({
      installment: index + 1,
      dueDate: payment.emi_duedate,
      amount: payment.amount,
      status: 'pending'
    }));

    return res.status(201).json({
      success: true,
      message: "EMIs created successfully",
      data: createdPayments,
      emiDetails: {
        totalEMIs: emi_number,
        emiAmount: emiAmount,
        startDate: start_date,
        endDate: end_date,
        frequency: emi_frequency,
        courseDuration: courseDuration,
        emiSchedule: emiSchedule
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------- ADD ONE SHOT EMI -----------------
exports.addOneShotPayment = async (req, res) => {
  try {
    const { student_id, amount, emi_discount = 0, emi_duedate, universityCode } = req.body;

    // Validate required fields
    if (!student_id || !amount || !emi_duedate || !universityCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: student_id, amount, emi_duedate, universityCode" 
      });
    }

    // Validate amount
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Amount must be a positive number" 
      });
    }

    // Validate date format and ensure it's a valid date
    const dueDate = new Date(emi_duedate);
    if (isNaN(dueDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format for EMI due date. Please provide a valid date." 
      });
    }

    // Ensure the due date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate <= today) {
      return res.status(400).json({ 
        success: false, 
        message: "EMI due date must be in the future" 
      });
    }

    // Validate university code
    if (!getUniversityByCode(universityCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid university code" 
      });
    }

    const existingPayment = await Payment.findOne({ student_id });
    if (existingPayment) {
      return res.status(400).json({ 
        success: false, 
        message: "Payment already exists for this student" 
      });
    }

    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ 
        success: false, 
        message: "Student not found" 
      });
    }
    
    if (student.status === "inactive") {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot create payment for inactive student" 
      });
    }

    // Check if student belongs to the same university
    if (student.universityCode !== universityCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Student does not belong to the specified university" 
      });
    }

    const netAmount = parseFloat(amount) - parseFloat(emi_discount || 0);

    const createdPayment = await Payment.create({
      student_id,
      is_paid: false,
      amount: netAmount,
      emi_discount: parseFloat(emi_discount || 0),
      emi_duedate: dueDate,
      universityCode,
    });

    await Student.findByIdAndUpdate(student_id, {
      count_emi: 1,
      discount_amount: emi_discount,
      final_amount: netAmount,
    });

    res.status(201).json({ 
      success: true, 
      message: "One-time payment created successfully",
      data: createdPayment 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------- GET ALL EMIS BY MONTH -----------------
exports.getPayments = async (req, res) => {
  try {
    const month = parseInt(req.query.month, 10);
    const year = parseInt(req.query.year, 10);
    const filter = req.query.filter?.toLowerCase();
    const universityCode = req.query.universityCode || req.body.universityCode;

    // Validate month and year
    if (isNaN(month) || month < 0 || month > 11) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid month. Must be between 0-11" 
      });
    }
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid year. Must be between 2000-2100" 
      });
    }

    // Validate university code if provided
    if (universityCode && !getUniversityByCode(universityCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid university code" 
      });
    }

    // Build query filter
    const queryFilter = {};
    if (universityCode) {
      queryFilter.universityCode = universityCode;
    }

    const allPayments = await Payment.find(queryFilter)
      .populate('student_id', 'name enrollmentId email phone department year universityCode');

    const filteredPayments = allPayments.filter((emi) => {
      const due = new Date(emi.emi_duedate);
      return due.getMonth() === month && due.getFullYear() === year;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let totalMissed = 0, totalPaid = 0, totalUpcoming = 0;
    const missedPayments = [], paidPayments = [], upcomingPayments = [];

    filteredPayments.forEach((emi) => {
      const due = new Date(emi.emi_duedate);
      const amt = emi.amount || 0;
      if (emi.is_paid) {
        totalPaid += amt;
        paidPayments.push(emi);
      } else if (due < today) {
        totalMissed += amt;
        missedPayments.push(emi);
      } else {
        totalUpcoming += amt;
        upcomingPayments.push(emi);
      }
    });

    let result;
    switch (filter) {
      case "paid": result = paidPayments; break;
      case "missed": result = missedPayments; break;
      case "upcoming": result = upcomingPayments; break;
      default: result = [...paidPayments, ...missedPayments, ...upcomingPayments];
    }

    res.json({
      success: true,
      message: "Payments retrieved successfully",
      data: {
        summary: {
          totalMissedFees: totalMissed,
          totalCollectedFees: totalPaid,
          totalUpcomingFees: totalUpcoming,
          totalPayments: filteredPayments.length,
        },
        details: result,
        filter: filter || 'all',
        month: month,
        year: year
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------- MARK EMI AS PAID -----------------
exports.markPaymentAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPaid, payment_date, txn_id } = req.body;
    
    // Validate required fields
    if (typeof isPaid !== 'boolean') {
      return res.status(400).json({ 
        success: false, 
        message: "isPaid must be a boolean value" 
      });
    }

    // Check if payment exists
    const existingPayment = await Payment.findById(id);
    if (!existingPayment) {
      return res.status(404).json({ 
        success: false, 
        message: "Payment not found" 
      });
    }
    
    // Prepare update object
    const updateData = { is_paid: isPaid };
    
    if (isPaid) {
      // If marking as paid, set payment date and transaction ID
      updateData.payment_date = payment_date ? new Date(payment_date) : new Date();
      if (txn_id) {
        updateData.txn_id = txn_id;
      }
    } else {
      // If marking as unpaid, clear payment date and transaction ID
      updateData.payment_date = null;
      updateData.txn_id = null;
    }
    
    const updated = await Payment.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('student_id', 'name enrollmentId email phone department year universityCode');
    
    res.json({ 
      success: true, 
      message: `Payment ${isPaid ? 'marked as paid' : 'marked as unpaid'} successfully`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ----------------- GET PAYMENT HISTORY OF ONE STUDENT -----------------
exports.getOneStudentPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const universityCode = req.query.universityCode || req.body.universityCode;
    
    // Validate university code if provided
    if (universityCode && !getUniversityByCode(universityCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid university code" 
      });
    }
    
    // Build query filter
    const queryFilter = { student_id: id };
    if (universityCode) {
      queryFilter.universityCode = universityCode;
    }
    
    const emis = await Payment.find(queryFilter)
      .populate('student_id', 'name enrollmentId email phone department year universityCode')
      .sort({ emi_duedate: 1 });

    if (!emis.length) {
      return res.status(404).json({ 
        success: false, 
        message: "No payment records found for this student" 
      });
    }

    const today = new Date();
    const result = emis.map((emi) => {
      let status = "upcoming";
      if (emi.is_paid) status = "paid";
      else if (new Date(emi.emi_duedate) < today) status = "missed";
      return { ...emi.toObject(), status };
    });

    // Calculate summary statistics
    const summary = {
      totalPayments: result.length,
      paidPayments: result.filter(p => p.status === 'paid').length,
      missedPayments: result.filter(p => p.status === 'missed').length,
      upcomingPayments: result.filter(p => p.status === 'upcoming').length,
      totalAmount: result.reduce((sum, p) => sum + p.amount, 0),
      paidAmount: result.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pendingAmount: result.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({ 
      success: true, 
      message: "Student payment history retrieved successfully",
      data: result,
      summary: summary
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
