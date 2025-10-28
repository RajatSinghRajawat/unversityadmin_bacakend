const Course = require('../models/Corsesmodel');
const { getUniversityByCode } = require('../config/universityConfig');
const { validateCourse } = require('../validation/courseValidation');

// Create Course
const createCourse = async (req, res) => {
    try {
        const courseData = req.body;
        
        // Handle banner image upload
        if (req.files && req.files.length > 0) {
            courseData.bannerImage = req.files[0].filename;
        }
        
        // Validate course data
        const validation = validateCourse(courseData);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validation.errors
            });
        }
        
        // Check if universityCode is provided
        if (!courseData.universityCode) {
            return res.status(400).json({
                success: false,
                message: 'University code is required',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }
        
        // Validate university code
        if (!getUniversityByCode(courseData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }

        const course = new Course(courseData);
        await course.save();
        
        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating course',
            error: error.message
        });
    }
};

// Get All Courses
const getAllCourses = async (req, res) => {
    try {
        const { universityCode, department, semester, isActive } = req.query;
        let filter = {};
        
        // Add filters if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            filter.universityCode = universityCode;
        }
        
        if (department) {
            filter.department = department;
        }
        
        if (semester) {
            filter.semester = semester;
        }
        
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const courses = await Course.find(filter).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving courses',
            error: error.message
        });
    }
};

// Get Course by ID
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Course retrieved successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving course',
            error: error.message
        });
    }
};

// Update Course
const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Handle banner image upload
        if (req.files && req.files.length > 0) {
            updateData.bannerImage = req.files[0].filename;
        }
        
        // Validate university code if provided
        if (updateData.universityCode && !getUniversityByCode(updateData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code'
            });
        }

        const course = await Course.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Course code already exists'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating course',
            error: error.message
        });
    }
};

// Delete Course
const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findByIdAndDelete(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
            data: course
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting course',
            error: error.message
        });
    }
};

// Search Courses
const searchCourses = async (req, res) => {
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
                { courseName: { $regex: query, $options: 'i' } },
                { courseCode: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } },
                { instructor: { $regex: query, $options: 'i' } }
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

        const courses = await Course.find(filter).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching courses',
            error: error.message
        });
    }
};

// Get Courses by Department
const getCoursesByDepartment = async (req, res) => {
    try {
        const { department, universityCode } = req.query;
        
        if (!department) {
            return res.status(400).json({
                success: false,
                message: 'Department is required'
            });
        }

        let filter = { department: department };

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

        const courses = await Course.find(filter).sort({ courseName: 1 });
        
        res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving courses by department',
            error: error.message
        });
    }
};

// Get Courses by Semester
const getCoursesBySemester = async (req, res) => {
    try {
        const { semester, universityCode } = req.query;
        
        if (!semester) {
            return res.status(400).json({
                success: false,
                message: 'Semester is required'
            });
        }

        let filter = { semester: semester };

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

        const courses = await Course.find(filter).sort({ courseName: 1 });
        
        res.status(200).json({
            success: true,
            message: 'Courses retrieved successfully',
            count: courses.length,
            data: courses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving courses by semester',
            error: error.message
        });
    }
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    searchCourses,
    getCoursesByDepartment,
    getCoursesBySemester
};
