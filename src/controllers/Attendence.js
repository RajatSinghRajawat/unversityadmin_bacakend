const Attendance = require('../models/attendence');
const Student = require('../models/StudentModel');
const { getUniversityByCode } = require('../config/universityConfig');

// Create Attendance Record
const createAttendance = async (req, res) => {
    try {
        const attendanceData = req.body;
        
        // Validate required fields
        const requiredFields = ['enrollment_id', 'status', 'attendance_date'];
        const missingFields = requiredFields.filter(field => !attendanceData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate student exists by enrollment_id
        const student = await Student.findOne({ enrollmentId: attendanceData.enrollment_id });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found with this enrollment ID'
            });
        }

        // Validate status
        const validStatuses = ['present', 'absent', 'half day'];
        if (!validStatuses.includes(attendanceData.status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be one of: present, absent, half day'
            });
        }

        // Validate attendance date is not in the future
        const attendanceDate = new Date(attendanceData.attendance_date);
        if (attendanceDate > new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Attendance date cannot be in the future'
            });
        }

        // Check if attendance already exists for this student on this date
        const existingAttendance = await Attendance.findOne({
            enrollment_id: attendanceData.enrollment_id,
            attendance_date: attendanceDate
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already recorded for this student on this date'
            });
        }

        const attendance = new Attendance(attendanceData);
        await attendance.save();
        
        // Populate student details for response
        await attendance.populate({
            path: 'enrollment_id',
            select: 'name email enrollmentId universityCode',
            model: 'Student'
        });
        
        res.status(201).json({
            success: true,
            message: 'Attendance record created successfully',
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating attendance record',
            error: error.message
        });
    }
};

// Get All Attendance Records
const getAllAttendance = async (req, res) => {
    try {
        const { 
            enrollment_id, 
            status, 
            universityCode, 
            startDate, 
            endDate,
            page = 1, 
            limit = 10 
        } = req.query;
        
        let filter = {};
        
        // Add filters
        if (enrollment_id) {
            filter.enrollment_id = enrollment_id;
        }
        
        if (status) {
            filter.status = status;
        }

        // Add date range filter
        if (startDate || endDate) {
            filter.attendance_date = {};
            if (startDate) {
                filter.attendance_date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.attendance_date.$lte = new Date(endDate);
            }
        }

        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            
            // Find students from this university and filter attendance
            const universityStudents = await Student.find({ universityCode }).select('enrollmentId');
            const enrollmentIds = universityStudents.map(student => student.enrollmentId);
            filter.enrollment_id = { $in: enrollmentIds };
        }

        const skip = (page - 1) * limit;
        
        const attendance = await Attendance.find(filter)
            .populate({
                path: 'enrollment_id',
                select: 'name email enrollmentId universityCode',
                model: 'Student'
            })
            .sort({ attendance_date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Attendance.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Attendance records retrieved successfully',
            count: attendance.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance records',
            error: error.message
        });
    }
};

// Get Attendance by ID
const getAttendanceById = async (req, res) => {
    try {
        const { id } = req.params;
        const attendance = await Attendance.findById(id)
            .populate({
                path: 'enrollment_id',
                select: 'name email enrollmentId universityCode',
                model: 'Student'
            });
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Attendance record retrieved successfully',
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance record',
            error: error.message
        });
    }
};

// Update Attendance
const updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate status if provided
        if (updateData.status) {
            const validStatuses = ['present', 'absent', 'half day'];
            if (!validStatuses.includes(updateData.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be one of: present, absent, half day'
                });
            }
        }

        // Validate student if enrollment_id is provided
        if (updateData.enrollment_id) {
            const student = await Student.findOne({ enrollmentId: updateData.enrollment_id });
            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: 'Student not found with this enrollment ID'
                });
            }
        }

        const attendance = await Attendance.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate({
            path: 'enrollment_id',
            select: 'name email enrollmentId universityCode',
            model: 'Student'
        });
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Attendance record updated successfully',
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating attendance record',
            error: error.message
        });
    }
};

// Delete Attendance
const deleteAttendance = async (req, res) => {
    try {
        const { id } = req.params;

        const attendance = await Attendance.findByIdAndDelete(id);
        
        if (!attendance) {
            return res.status(404).json({
                success: false,
                message: 'Attendance record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Attendance record deleted successfully',
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting attendance record',
            error: error.message
        });
    }
};

// Get Attendance by Student
const getAttendanceByStudent = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { status, startDate, endDate, page = 1, limit = 10 } = req.query;
        
        // Validate student exists
        const student = await Student.findOne({ enrollmentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        let filter = { enrollment_id: enrollmentId };
        
        if (status) {
            filter.status = status;
        }

        // Add date range filter
        if (startDate || endDate) {
            filter.attendance_date = {};
            if (startDate) {
                filter.attendance_date.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.attendance_date.$lte = new Date(endDate);
            }
        }
        
        const skip = (page - 1) * limit;
        
        const attendance = await Attendance.find(filter)
            .sort({ attendance_date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Attendance.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Student attendance retrieved successfully',
            count: attendance.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: attendance
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving student attendance',
            error: error.message
        });
    }
};

// Get Attendance Statistics
const getAttendanceStatistics = async (req, res) => {
    try {
        const { universityCode, startDate, endDate } = req.query;
        let matchFilter = {};
        
        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            
            const universityStudents = await Student.find({ universityCode }).select('enrollmentId');
            const enrollmentIds = universityStudents.map(student => student.enrollmentId);
            matchFilter.enrollment_id = { $in: enrollmentIds };
        }

        // Add date range filter
        if (startDate || endDate) {
            matchFilter.attendance_date = {};
            if (startDate) {
                matchFilter.attendance_date.$gte = new Date(startDate);
            }
            if (endDate) {
                matchFilter.attendance_date.$lte = new Date(endDate);
            }
        }
        
        const stats = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalRecords: { $sum: 1 },
                    presentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    },
                    absentCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
                    },
                    halfDayCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'half day'] }, 1, 0] }
                    }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalRecords: 0,
            presentCount: 0,
            absentCount: 0,
            halfDayCount: 0
        };
        
        const attendanceRate = result.totalRecords > 0 ? 
            ((result.presentCount + result.halfDayCount * 0.5) / result.totalRecords * 100).toFixed(2) : 0;
        
        res.status(200).json({
            success: true,
            message: 'Attendance statistics retrieved successfully',
            data: {
                ...result,
                attendanceRate: parseFloat(attendanceRate)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving attendance statistics',
            error: error.message
        });
    }
};

// Get Student Attendance Summary
const getStudentAttendanceSummary = async (req, res) => {
    try {
        const { enrollmentId } = req.params;
        const { startDate, endDate } = req.query;
        
        // Validate student exists
        const student = await Student.findOne({ enrollmentId });
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        let matchFilter = { enrollment_id: enrollmentId };
        
        // Add date range filter
        if (startDate || endDate) {
            matchFilter.attendance_date = {};
            if (startDate) {
                matchFilter.attendance_date.$gte = new Date(startDate);
            }
            if (endDate) {
                matchFilter.attendance_date.$lte = new Date(endDate);
            }
        }
        
        const summary = await Attendance.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalDays: { $sum: 1 },
                    presentDays: {
                        $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
                    },
                    absentDays: {
                        $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
                    },
                    halfDays: {
                        $sum: { $cond: [{ $eq: ['$status', 'half day'] }, 1, 0] }
                    }
                }
            }
        ]);
        
        const result = summary[0] || {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            halfDays: 0
        };
        
        const attendanceRate = result.totalDays > 0 ? 
            ((result.presentDays + result.halfDays * 0.5) / result.totalDays * 100).toFixed(2) : 0;
        
        res.status(200).json({
            success: true,
            message: 'Student attendance summary retrieved successfully',
            data: {
                student: {
                    name: student.name,
                    enrollmentId: student.enrollmentId,
                    universityCode: student.universityCode
                },
                attendance: {
                    ...result,
                    attendanceRate: parseFloat(attendanceRate)
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving student attendance summary',
            error: error.message
        });
    }
};

// Bulk Mark Attendance
const bulkMarkAttendance = async (req, res) => {
    try {
        const { attendanceRecords, attendance_date } = req.body;
        
        if (!attendanceRecords || !Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Attendance records array is required'
            });
        }
        
        if (!attendance_date) {
            return res.status(400).json({
                success: false,
                message: 'Attendance date is required'
            });
        }

        const results = {
            success: 0,
            errors: [],
            total: attendanceRecords.length
        };

        // Process each attendance record
        for (let i = 0; i < attendanceRecords.length; i++) {
            const record = attendanceRecords[i];
            
            try {
                // Validate required fields
                if (!record.enrollment_id || !record.status) {
                    results.errors.push({
                        index: i,
                        message: 'Missing enrollment_id or status'
                    });
                    continue;
                }

                // Validate student exists
                const student = await Student.findOne({ enrollmentId: record.enrollment_id });
                if (!student) {
                    results.errors.push({
                        index: i,
                        enrollment_id: record.enrollment_id,
                        message: 'Student not found'
                    });
                    continue;
                }

                // Check if attendance already exists
                const existingAttendance = await Attendance.findOne({
                    enrollment_id: record.enrollment_id,
                    attendance_date: new Date(attendance_date)
                });

                if (existingAttendance) {
                    results.errors.push({
                        index: i,
                        enrollment_id: record.enrollment_id,
                        message: 'Attendance already recorded for this date'
                    });
                    continue;
                }

                // Create attendance record
                const attendanceData = {
                    enrollment_id: record.enrollment_id,
                    status: record.status,
                    attendance_date: new Date(attendance_date),
                    in_time: record.in_time || null,
                    out_time: record.out_time || null
                };

                const attendance = new Attendance(attendanceData);
                await attendance.save();
                results.success++;

            } catch (error) {
                results.errors.push({
                    index: i,
                    enrollment_id: record.enrollment_id,
                    message: error.message
                });
            }
        }

        res.status(200).json({
            success: true,
            message: `Bulk attendance completed. ${results.success} records created successfully`,
            data: {
                total: results.total,
                successful: results.success,
                failed: results.errors.length,
                errors: results.errors
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing bulk attendance',
            error: error.message
        });
    }
};

module.exports = {
    createAttendance,
    getAllAttendance,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    getAttendanceByStudent,
    getAttendanceStatistics,
    getStudentAttendanceSummary,
    bulkMarkAttendance
};
