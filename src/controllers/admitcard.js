const Admitcard = require('../models/admitcardmodel');
const Student = require('../models/StudentModel');
const Course = require('../models/Corsesmodel');
const { getUniversityByCode } = require('../config/universityConfig');

// Create Admitcard
const createAdmitcard = async (req, res) => {
    try {
        const admitcardData = req.body;
        
        // Validate required fields (updated for dynamic subjects)
        const requiredFields = ['student_id', 'course_id', 'semester', 'exam_type', 'exam_center', 'room_no', 'status', 'subjects', 'universityCode'];
        const missingFields = requiredFields.filter(field => !admitcardData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate subjects array
        if (!Array.isArray(admitcardData.subjects) || admitcardData.subjects.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Subjects array is required and must contain at least one subject'
            });
        }

        // Validate each subject has required fields
        for (let i = 0; i < admitcardData.subjects.length; i++) {
            const subject = admitcardData.subjects[i];
            const subjectRequiredFields = ['subjectName', 'examDate', 'examStartTime', 'examEndTime'];
            const missingSubjectFields = subjectRequiredFields.filter(field => !subject[field]);
            
            if (missingSubjectFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Subject ${i + 1} is missing required fields: ${missingSubjectFields.join(', ')}`
                });
            }
        }

        // Validate student exists
        const student = await Student.findById(admitcardData.student_id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Validate course exists
        const course = await Course.findById(admitcardData.course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Validate university code
        if (!getUniversityByCode(admitcardData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }

        // Check if admitcard already exists for this student, exam type, and semester
        const existingAdmitcard = await Admitcard.findOne({
            student_id: admitcardData.student_id,
            exam_type: admitcardData.exam_type,
            semester: admitcardData.semester,
            universityCode: admitcardData.universityCode
        });

        if (existingAdmitcard) {
            return res.status(400).json({
                success: false,
                message: 'Admitcard already exists for this student, exam type, and semester'
            });
        }

        const admitcard = new Admitcard(admitcardData);
        await admitcard.save();
        
        // Populate related data
        await admitcard.populate([
            { path: 'student_id', select: 'name email enrollmentId universityCode' },
            { path: 'course_id', select: 'courseName courseCode department' }
        ]);
        
        res.status(201).json({
            success: true,
            message: 'Admitcard created successfully',
            data: admitcard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating admitcard',
            error: error.message
        });
    }
};

// Get All Admitcards
const getAllAdmitcards = async (req, res) => {
    try {
        const { 
            student_id, 
            course_id, 
            semester, 
            exam_type, 
            status, 
            universityCode,
            page = 1, 
            limit = 10 
        } = req.query;
        
        let filter = {};
        
        // Add filters
        if (student_id) {
            filter.student_id = student_id;
        }
        
        if (course_id) {
            filter.course_id = course_id;
        }
        
        if (semester) {
            filter.semester = semester;
        }
        
        if (exam_type) {
            filter.exam_type = exam_type;
        }
        
        if (status) {
            filter.status = status;
        }

        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            filter.universityCode = universityCode;
        }

        const skip = (page - 1) * limit;
        
        const admitcards = await Admitcard.find(filter)
            .populate('student_id', 'name email enrollmentId universityCode')
            .populate('course_id', 'courseName courseCode department')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Admitcard.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Admitcards retrieved successfully',
            count: admitcards.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: admitcards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving admitcards',
            error: error.message
        });
    }
};

// Get Admitcard by ID
const getAdmitcardById = async (req, res) => {
    try {
        const { id } = req.params;
        const admitcard = await Admitcard.findById(id)
            .populate('student_id', 'name email enrollmentId universityCode')
            .populate('course_id', 'courseName courseCode department');
        
        if (!admitcard) {
            return res.status(404).json({
                success: false,
                message: 'Admitcard not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Admitcard retrieved successfully',
            data: admitcard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving admitcard',
            error: error.message
        });
    }
};

// Update Admitcard
const updateAdmitcard = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate university code if provided
        if (updateData.universityCode && !getUniversityByCode(updateData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code'
            });
        }

        // Validate student if provided
        if (updateData.student_id) {
            const student = await Student.findById(updateData.student_id);
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found'
                });
            }
        }

        // Validate course if provided
        if (updateData.course_id) {
            const course = await Course.findById(updateData.course_id);
            if (!course) {
                return res.status(404).json({
                    success: false,
                    message: 'Course not found'
                });
            }
        }

        const admitcard = await Admitcard.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate([
            { path: 'student_id', select: 'name email enrollmentId universityCode' },
            { path: 'university_id', select: 'name code' },
            { path: 'course_id', select: 'courseName courseCode department' }
        ]);
        
        if (!admitcard) {
            return res.status(404).json({
                success: false,
                message: 'Admitcard not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Admitcard updated successfully',
            data: admitcard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating admitcard',
            error: error.message
        });
    }
};

// Delete Admitcard
const deleteAdmitcard = async (req, res) => {
    try {
        const { id } = req.params;

        const admitcard = await Admitcard.findByIdAndDelete(id);
        
        if (!admitcard) {
            return res.status(404).json({
                success: false,
                message: 'Admitcard not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Admitcard deleted successfully',
            data: admitcard
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting admitcard',
            error: error.message
        });
    }
};

// Get Admitcards by Student
const getAdmitcardsByStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semester, exam_type, status, page = 1, limit = 10 } = req.query;
        
        // Validate student exists
        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        let filter = { student_id: studentId };
        
        if (semester) {
            filter.semester = semester;
        }
        
        if (exam_type) {
            filter.exam_type = exam_type;
        }
        
        if (status) {
            filter.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const admitcards = await Admitcard.find(filter)
            .populate('course_id', 'courseName courseCode department')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Admitcard.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Student admitcards retrieved successfully',
            count: admitcards.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: admitcards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving student admitcards',
            error: error.message
        });
    }
};

// Get Admitcards by Course
const getAdmitcardsByCourse = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { semester, exam_type, status, page = 1, limit = 10 } = req.query;
        
        // Validate course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        let filter = { course_id: courseId };
        
        if (semester) {
            filter.semester = semester;
        }
        
        if (exam_type) {
            filter.exam_type = exam_type;
        }
        
        if (status) {
            filter.status = status;
        }
        
        const skip = (page - 1) * limit;
        
        const admitcards = await Admitcard.find(filter)
            .populate('student_id', 'name email enrollmentId universityCode')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Admitcard.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Course admitcards retrieved successfully',
            count: admitcards.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: admitcards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving course admitcards',
            error: error.message
        });
    }
};

// Search Admitcards
const searchAdmitcards = async (req, res) => {
    try {
        const { query, universityCode } = req.query;
        
        if (!query) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        let filter = {
            $or: [
                { exam_center: { $regex: query, $options: 'i' } },
                { room_no: { $regex: query, $options: 'i' } },
                { 'subjects.subjectName': { $regex: query, $options: 'i' } }
            ]
        };

        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            filter.universityCode = universityCode;
        }

        const admitcards = await Admitcard.find(filter)
            .populate('student_id', 'name email enrollmentId universityCode')
            .populate('course_id', 'courseName courseCode department')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            count: admitcards.length,
            data: admitcards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching admitcards',
            error: error.message
        });
    }
};

// Get Upcoming Exams
const getUpcomingExams = async (req, res) => {
    try {
        const { universityCode, days = 30 } = req.query;
        let filter = {
            $or: [
                { exam_date: { $gte: new Date().toISOString().split('T')[0] } },
                { 'subjects.examDate': { $gte: new Date().toISOString().split('T')[0] } }
            ]
        };
        
        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            filter.universityCode = universityCode;
        }
        
        // Calculate date range
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + parseInt(days));
        
        const admitcards = await Admitcard.find(filter)
            .populate('student_id', 'name email enrollmentId universityCode')
            .populate('course_id', 'courseName courseCode department')
            .sort({ 'subjects.examDate': 1, 'subjects.examStartTime': 1 });
        
        res.status(200).json({
            success: true,
            message: 'Upcoming exams retrieved successfully',
            count: admitcards.length,
            data: admitcards
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving upcoming exams',
            error: error.message
        });
    }
};

module.exports = {
    createAdmitcard,
    getAllAdmitcards,
    getAdmitcardById,
    updateAdmitcard,
    deleteAdmitcard,
    getAdmitcardsByStudent,
    getAdmitcardsByCourse,
    searchAdmitcards,
    getUpcomingExams
};
