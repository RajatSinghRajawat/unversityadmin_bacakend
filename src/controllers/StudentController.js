
const Course = require('../models/Corsesmodel');
const { getUniversityByCode } = require('../config/universityConfig');
const Student = require('../models/StudentModel');

// Create Student
const createStudent = async (req, res) => {
    try {
        const studentData = req.body;
        
        const imgs = req.files ? req.files.map(file => file.filename) : [];
        studentData.image = imgs.length > 0 ? imgs[0] : '';
        
        // Check if universityCode is provided
        if (!studentData.universityCode) {
            return res.status(400).json({
                success: false,
                message: 'University code is required',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }
        
        // Validate university code
        if (!getUniversityByCode(studentData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }

        // Validate course_id (now required)
        if (!studentData.course_id) {
            return res.status(400).json({
                success: false,
                message: 'Course selection is required'
            });
        }

        const course = await Course.findById(studentData.course_id);
        if (!course) {
            return res.status(400).json({
                success: false,
                message: 'Invalid course ID'
            });
        }
        
        // Check if course belongs to the same university
        if (course.universityCode !== studentData.universityCode) {
            return res.status(400).json({
                success: false,
                message: 'Course does not belong to the selected university'
            });
        }

        const student = new Student(studentData);
        await student.save();

        // Add student to course
        await Course.findByIdAndUpdate(
            studentData.course_id,
            { $addToSet: { students: student._id } }
        );
        
        res.status(201).json({
            success: true,
            message: 'Student created successfully',
            data: student
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating student',
            error: error.message
        });
    }
};

// Get All Students
const getAllStudents = async (req, res) => {
    try {
        const { universityCode } = req.query;
        let filter = { status: 'active'};
        
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

        const students = await Student.find(filter)
            .populate('course_id', 'courseName courseCode department duration semester year price discountPrice')
            .populate('session_id', 'sessionName startDate endDate')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Students retrieved successfully',
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving students',
            error: error.message
        });
    }
};

// Get Student by ID
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id)
            .populate('course_id', 'courseName courseCode department duration semester year price discountPrice')
            .populate('session_id', 'sessionName startDate endDate');
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Student retrieved successfully',
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving student',
            error: error.message
        });
    }
};

// Update Student
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const imgs = req.files ? req.files.map(file => file.filename) : [];
        updateData.image = imgs.length > 0 ? imgs[0] : '';
        // Validate university code if provided
        if (updateData.universityCode && !getUniversityByCode(updateData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code'
            });
        }

        // Validate course_id if provided
        if (updateData.course_id) {
            const course = await Course.findById(updateData.course_id);
            if (!course) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid course ID'
                });
            }
            
            // Check if course belongs to the same university
            const universityCode = updateData.universityCode || (await Student.findById(id))?.universityCode;
            if (course.universityCode !== universityCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Course does not belong to the selected university'
                });
            }
        }

        const oldStudent = await Student.findById(id);
        if (!oldStudent) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = await Student.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );

        // Update course associations if course_id changed
        if (updateData.course_id && updateData.course_id !== oldStudent.course_id?.toString()) {
            // Remove student from old course
            if (oldStudent.course_id) {
                await Course.findByIdAndUpdate(
                    oldStudent.course_id,
                    { $pull: { students: student._id } }
                );
            }
            
            // Add student to new course
            await Course.findByIdAndUpdate(
                updateData.course_id,
                { $addToSet: { students: student._id } }
            );
        }
        
        res.status(200).json({
            success: true,
            message: 'Student updated successfully',
            data: student
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating student',
            error: error.message
        });
    }
};

// Delete Student
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Remove student from course
        if (student.course_id) {
            await Course.findByIdAndUpdate(
                student.course_id,
                { $pull: { students: student._id } }
            );
        }

        // Update status instead of deleting
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            { status: 'deactive' },
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Student deactivated successfully',
            data: updatedStudent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating student',
            error: error.message
        });
    }
};

const getExStudents = async (req, res) => {
    try {
        const { universityCode } = req.query;
        let filter = { status: 'deactive' };
        
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

        const exStudents = await Student.find(filter)
            .populate('course_id', 'courseName courseCode department duration semester year price discountPrice')
            .populate('session_id', 'sessionName startDate endDate')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: exStudents.length,
            data: exStudents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ex-students',
            error: error.message
        });
    }
};

// Reactivate Student
const reactivateStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await Student.findByIdAndUpdate(
            id,
            { status: 'active' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Add student back to course
        if (student.course_id) {
            await Course.findByIdAndUpdate(
                student.course_id,
                { $addToSet: { students: student._id } }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Student reactivated successfully',
            data: student
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reactivating student',
            error: error.message
        });
    }
};


// Search Students
const searchStudents = async (req, res) => {
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
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } }
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

        const students = await Student.find(filter)
            .populate('course_id', 'courseName courseCode department duration semester year price discountPrice')
            .populate('session_id', 'sessionName startDate endDate')
            .sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            count: students.length,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching students',
            error: error.message
        });
    }
};


//upload excel
const uploadStudentsFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required'
            });
        }

        const XLSX = require('xlsx');
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is empty'
            });
        }

        const results = {
            success: 0,
            errors: [],
            total: jsonData.length
        };

        // Process each row
        for (let i = 0; i < jsonData.length; i++) {
            const rowData = jsonData[i];
            const rowNumber = i + 2; // +2 because Excel starts from row 2 (after header)

            try {
                // Validate required fields
                const requiredFields = [
                    'name', 'email', 'phone', 'address', 'department', 
                    'year', 'guardianName', 'guardianPhone', 'emergencyContact',
                    'universityCode', 'enrollmentId', 'JoiningDate', 
                    'DateOfBirth', 'Gender', 'aadharNo', 'course_id'
                ];

                const missingFields = requiredFields.filter(field => !rowData[field]);
                if (missingFields.length > 0) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    continue;
                }

                // Validate university code
                if (!getUniversityByCode(rowData.universityCode)) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Invalid university code: ${rowData.universityCode}`
                    });
                    continue;
                }

                // Validate course_id
                const course = await Course.findById(rowData.course_id);
                if (!course) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Invalid course ID: ${rowData.course_id}`
                    });
                    continue;
                }

                // Check if course belongs to the same university
                if (course.universityCode !== rowData.universityCode) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Course does not belong to university: ${rowData.universityCode}`
                    });
                    continue;
                }

                // Check if email already exists
                const existingStudent = await Student.findOne({ email: rowData.email });
                if (existingStudent) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Email already exists: ${rowData.email}`
                    });
                    continue;
                }

                // Create student
                const student = new Student(rowData);
                await student.save();

                // Add student to course
                await Course.findByIdAndUpdate(
                    rowData.course_id,
                    { $addToSet: { students: student._id } }
                );

                results.success++;

            } catch (error) {
                results.errors.push({
                    row: rowNumber,
                    message: error.message
                });
            }
        }

        // Delete uploaded file after processing
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: `Excel upload completed. ${results.success} students created successfully`,
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
            message: 'Error processing Excel file',
            error: error.message
        });
    }
};




// Get student by email OR password (flexible search)
const getStudentByEmailOrPassword = async (req, res) => {
    try {
        const { email, password } = req.query;
        const universityCode = req.query.universityCode;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Both email and password are required' 
            });
        }
        
        // Build query filter - match both email and password exactly
        const queryFilter = {
            email: email,
            password: password
        };
        
        if (universityCode) {
            queryFilter.universityCode = universityCode;
        }
        
        const student = await Student.findOne(queryFilter)
            .populate('course_id', 'courseName courseCode price discountPrice duration')
            .select('-password'); // Exclude password from response for security
        
        if (!student) {
            return res.status(404).json({ 
                success: false, 
                message: 'No student found with this email and password combination' 
            });
        }
        
        res.status(200).json({ 
            success: true, 
            data: student,
            message: 'Student found successfully'
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error searching student', error: error.message });
    }
};




module.exports = {
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
};
