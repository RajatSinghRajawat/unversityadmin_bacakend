const Employee = require('../models/employees');
const { getUniversityByCode } = require('../config/universityConfig');

// Create Employee
const createEmployee = async (req, res) => {
    try {
        const employeeData = req.body;
        
        // Handle image upload - optional field
        if (req.files && req.files.length > 0) {
            employeeData.image = req.files[0].filename;
        }
        
        // Validate required fields
        const requiredFields = [
            'name', 'email', 'phone', 'address', 'department', 'designation', 
            'salary', 'joiningDate', 'qualification', 'experience', 'emergencyContact',
            'universityCode', 'employeeId', 'status', 'dateOfBirth', 'gender', 
            'aadharNo', 'accountStatus', 'accountType', 'accountNumber', 
            'accountHolderName', 'accountBankName', 'accountIFSCCode'
        ];
        
        const missingFields = requiredFields.filter(field => !employeeData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate university code
        if (!getUniversityByCode(employeeData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code',
                availableCodes: ['GYAN001', 'GYAN002']
            });
        }

        // Check if email already exists
        const existingEmail = await Employee.findOne({ email: employeeData.email });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Check if employee ID already exists
        const existingEmployeeId = await Employee.findOne({ employeeId: employeeData.employeeId });
        if (existingEmployeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID already exists'
            });
        }

        // Handle address - parse JSON string if needed
        if (typeof employeeData.address === 'string') {
            try {
                employeeData.address = JSON.parse(employeeData.address);
            } catch (error) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid address format'
                });
            }
        }

        // Validate address structure
        if (!Array.isArray(employeeData.address) || employeeData.address.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Address array is required'
            });
        }

        const employee = new Employee(employeeData);
        await employee.save();
        
        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            data: employee
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate field value'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating employee',
            error: error.message
        });
    }
};

// Get All Employees
const getAllEmployees = async (req, res) => {
    try {
        const { 
            universityCode, 
            department, 
            designation, 
            status, 
            accountStatus,
            isActive,
            page = 1, 
            limit = 100  // Default limit increased to 100
        } = req.query;
        
        let filter = {};
        
        // Add filters
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
        
        if (designation) {
            filter.designation = designation;
        }
        
        if (status) {
            filter.status = status;
        }
        
        if (accountStatus) {
            filter.accountStatus = accountStatus;
        }
        
        if (isActive !== undefined) {
            filter.isActive = isActive === 'true';
        }

        const skip = (page - 1) * limit;
        
        console.log('🔍 Query parameters:', {
            universityCode,
            department,
            designation,
            status,
            accountStatus,
            isActive,
            page,
            limit,
            filter
        });
        
        const employees = await Employee.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Employee.countDocuments(filter);
        
        console.log(`📋 Query Results:
        - Filter: ${JSON.stringify(filter)}
        - Skip: ${skip}
        - Limit: ${parseInt(limit)}
        - Found: ${employees.length} employees
        - Total: ${total} employees
        - University: ${universityCode || 'All'}`);
        
        res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully',
            count: employees.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: employees
        });
    } catch (error) {
        console.error('❌ Error fetching employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving employees',
            error: error.message
        });
    }
};

// Get Employee by ID
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const employee = await Employee.findById(id);
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Employee retrieved successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving employee',
            error: error.message
        });
    }
};

// Update Employee
const updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Handle image upload - optional field
        if (req.files && req.files.length > 0) {
            updateData.image = req.files[0].filename;
        }
        
        // Validate university code if provided
        if (updateData.universityCode && !getUniversityByCode(updateData.universityCode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid university code'
            });
        }

        // Check email uniqueness if email is being updated
        if (updateData.email) {
            const existingEmail = await Employee.findOne({ 
                email: updateData.email, 
                _id: { $ne: id } 
            });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Check employee ID uniqueness if employeeId is being updated
        if (updateData.employeeId) {
            const existingEmployeeId = await Employee.findOne({ 
                employeeId: updateData.employeeId, 
                _id: { $ne: id } 
            });
            if (existingEmployeeId) {
                return res.status(400).json({
                    success: false,
                    message: 'Employee ID already exists'
                });
            }
        }

        const employee = await Employee.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Employee updated successfully',
            data: employee
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Duplicate field value'
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating employee',
            error: error.message
        });
    }
};

// Delete Employee (Soft Delete - Update isActive status)
const deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true }
        );
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee deactivated successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deactivating employee',
            error: error.message
        });
    }
};

// Reactivate Employee
const reactivateEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const employee = await Employee.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true }
        );
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Employee reactivated successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error reactivating employee',
            error: error.message
        });
    }
};

// Search Employees
const searchEmployees = async (req, res) => {
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
                { employeeId: { $regex: query, $options: 'i' } },
                { department: { $regex: query, $options: 'i' } },
                { designation: { $regex: query, $options: 'i' } }
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

        const employees = await Employee.find(filter).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            message: 'Search completed successfully',
            count: employees.length,
            data: employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error searching employees',
            error: error.message
        });
    }
};

// Get Employees by Department
const getEmployeesByDepartment = async (req, res) => {
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

        const employees = await Employee.find(filter).sort({ name: 1 });
        
        res.status(200).json({
            success: true,
            message: 'Employees retrieved successfully',
            count: employees.length,
            data: employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving employees by department',
            error: error.message
        });
    }
};

// Get All Employees Without Pagination (for Excel upload verification)
const getAllEmployeesSimple = async (req, res) => {
    try {
        const { universityCode } = req.query;
        
        let filter = {};
        
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            filter.universityCode = universityCode;
        }
        
        const employees = await Employee.find(filter)
            .sort({ createdAt: -1 });
        
        console.log(`📋 Simple Query - Found ${employees.length} employees for university: ${universityCode || 'All'}`);
        
        res.status(200).json({
            success: true,
            message: 'All employees retrieved successfully',
            count: employees.length,
            data: employees
        });
    } catch (error) {
        console.error('❌ Error retrieving all employees:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving all employees',
            error: error.message
        });
    }
};

// Get Employee Statistics
const getEmployeeStatistics = async (req, res) => {
    try {
        const { universityCode } = req.query;
        let matchFilter = {};
        
        // Add university filter if provided
        if (universityCode) {
            if (!getUniversityByCode(universityCode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid university code'
                });
            }
            matchFilter.universityCode = universityCode;
        }
        
        const stats = await Employee.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalEmployees: { $sum: 1 },
                    activeEmployees: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    },
                    inactiveEmployees: {
                        $sum: { $cond: ['$isActive', 0, 1] }
                    }
                }
            }
        ]);

        // Get department-wise statistics
        const departmentStats = await Employee.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$department',
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // Get designation-wise statistics
        const designationStats = await Employee.aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$designation',
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: ['$isActive', 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        const result = stats[0] || {
            totalEmployees: 0,
            activeEmployees: 0,
            inactiveEmployees: 0
        };
        
        res.status(200).json({
            success: true,
            message: 'Employee statistics retrieved successfully',
            data: {
                overview: result,
                departmentBreakdown: departmentStats,
                designationBreakdown: designationStats
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving employee statistics',
            error: error.message
        });
    }
};

// Get Employee by Employee ID
const getEmployeeByEmployeeId = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const employee = await Employee.findOne({ employeeId });
        
        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Employee retrieved successfully',
            data: employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving employee',
            error: error.message
        });
    }
};

// Upload Employees from Excel
const uploadEmployeesFromExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Excel file is required'
            });
        }

        const XLSX = require('xlsx');
        const fs = require('fs');
        
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
            // Delete uploaded file
            fs.unlinkSync(req.file.path);
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
            const row = jsonData[i];
            const rowNumber = i + 2; // Excel row number (accounting for header)

            try {
                // Map Excel columns to employee data
                const employeeData = {
                    name: row.name || row.Name,
                    email: row.email || row.Email,
                    phone: row.phone || row.Phone,
                    department: row.department || row.Department,
                    designation: row.designation || row.Designation,
                    salary: row.salary || row.Salary,
                    joiningDate: row.joiningDate || row.JoiningDate || row['Joining Date'],
                    qualification: row.qualification || row.Qualification,
                    experience: row.experience || row.Experience,
                    emergencyContact: row.emergencyContact || row.EmergencyContact || row['Emergency Contact'],
                    universityCode: row.universityCode || row.UniversityCode || row['University Code'],
                    employeeId: row.employeeId || row.EmployeeId || row['Employee ID'],
                    status: row.status || row.Status || 'Active',
                    dateOfBirth: row.dateOfBirth || row.DateOfBirth || row['Date of Birth'],
                    gender: row.gender || row.Gender,
                    aadharNo: row.aadharNo || row.AadharNo || row['Aadhar No'],
                    accountStatus: row.accountStatus || row.AccountStatus || row['Account Status'] || 'Active',
                    accountType: row.accountType || row.AccountType || row['Account Type'],
                    accountNumber: row.accountNumber || row.AccountNumber || row['Account Number'],
                    accountHolderName: row.accountHolderName || row.AccountHolderName || row['Account Holder Name'],
                    accountBankName: row.accountBankName || row.AccountBankName || row['Account Bank Name'],
                    accountIFSCCode: row.accountIFSCCode || row.AccountIFSCCode || row['Account IFSC Code'],
                    address: []
                };

                // Handle address - parse from Excel columns
                const addressData = {
                    state: row.state || row.State || '',
                    permanentAddress: row.permanentAddress || row.PermanentAddress || row['Permanent Address'] || '',
                    city: row.city || row.City || '',
                    pincode: row.pincode || row.Pincode || row.Pincode || ''
                };

                if (addressData.state && addressData.permanentAddress && addressData.city && addressData.pincode) {
                    employeeData.address = [addressData];
                }

                // Validate required fields
                const requiredFields = [
                    'name', 'email', 'phone', 'address', 'department', 'designation', 
                    'salary', 'joiningDate', 'qualification', 'experience', 'emergencyContact',
                    'universityCode', 'employeeId', 'status', 'dateOfBirth', 'gender', 
                    'aadharNo', 'accountStatus', 'accountType', 'accountNumber', 
                    'accountHolderName', 'accountBankName', 'accountIFSCCode'
                ];

                const missingFields = requiredFields.filter(field => {
                    if (field === 'address') {
                        return !employeeData.address || employeeData.address.length === 0;
                    }
                    return !employeeData[field];
                });

                if (missingFields.length > 0) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Missing required fields: ${missingFields.join(', ')}`
                    });
                    continue;
                }

                // Validate university code
                if (!getUniversityByCode(employeeData.universityCode)) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Invalid university code: ${employeeData.universityCode}`
                    });
                    continue;
                }

                // Check if email already exists
                const existingEmail = await Employee.findOne({ email: employeeData.email });
                if (existingEmail) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Email already exists: ${employeeData.email}`
                    });
                    continue;
                }

                // Check if employee ID already exists
                const existingEmployeeId = await Employee.findOne({ employeeId: employeeData.employeeId });
                if (existingEmployeeId) {
                    results.errors.push({
                        row: rowNumber,
                        message: `Employee ID already exists: ${employeeData.employeeId}`
                    });
                    continue;
                }

                // Handle image for Excel upload - optional field
                // No default image needed as it's optional

                // Create employee
                const employee = new Employee(employeeData);
                await employee.save();

                console.log(`✅ Employee created successfully: ${employee.name} (${employee.employeeId})`);
                results.success++;

            } catch (error) {
                console.error(`❌ Error creating employee at row ${rowNumber}:`, error.message);
                results.errors.push({
                    row: rowNumber,
                    message: error.message
                });
            }
        }

        // Delete uploaded file after processing
        fs.unlinkSync(req.file.path);

        console.log(`\n📊 Excel Upload Summary: ${results.success}/${results.total} employees created successfully`);

        res.status(200).json({
            success: true,
            message: `Excel upload completed. ${results.success} employees created successfully`,
            data: {
                total: results.total,
                successful: results.success,
                failed: results.errors.length,
                errors: results.errors
            }
        });

    } catch (error) {
        // Delete uploaded file if exists
        if (req.file && req.file.path) {
            const fs = require('fs');
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }

        res.status(500).json({
            success: false,
            message: 'Error uploading employees from Excel',
            error: error.message
        });
    }
};

// Download Employee Template
const downloadEmployeeTemplate = async (req, res) => {
    try {
        const XLSX = require('xlsx');
        
        // Sample data for template
        const templateData = [
            {
                'Name': 'Dr. John Doe',
                'Email': 'john.doe@university.com',
                'Phone': '9876543210',
                'Department': 'Computer Science',
                'Designation': 'Professor',
                'Salary': '75000',
                'Joining Date': '2024-01-15',
                'Qualification': 'PhD in Computer Science',
                'Experience': '10 years',
                'Emergency Contact': '9876543211',
                'University Code': 'GYAN001',
                'Employee ID': 'EMP001',
                'Status': 'Active',
                'Date of Birth': '1980-05-15',
                'Gender': 'Male',
                'Aadhar No': '123456789012',
                'State': 'Delhi',
                'Permanent Address': '123 Main Street',
                'City': 'New Delhi',
                'Pincode': '110001',
                'Account Status': 'Active',
                'Account Type': 'Savings',
                'Account Number': '1234567890',
                'Account Holder Name': 'Dr. John Doe',
                'Account Bank Name': 'State Bank of India',
                'Account IFSC Code': 'SBIN0001234'
            },
            {
                'Name': 'Ms. Jane Smith',
                'Email': 'jane.smith@university.com',
                'Phone': '9876543212',
                'Department': 'Mathematics',
                'Designation': 'Associate Professor',
                'Salary': '65000',
                'Joining Date': '2024-02-01',
                'Qualification': 'PhD in Mathematics',
                'Experience': '8 years',
                'Emergency Contact': '9876543213',
                'University Code': 'GYAN001',
                'Employee ID': 'EMP002',
                'Status': 'Active',
                'Date of Birth': '1985-08-20',
                'Gender': 'Female',
                'Aadhar No': '123456789013',
                'State': 'Maharashtra',
                'Permanent Address': '456 Park Avenue',
                'City': 'Mumbai',
                'Pincode': '400001',
                'Account Status': 'Active',
                'Account Type': 'Savings',
                'Account Number': '0987654321',
                'Account Holder Name': 'Ms. Jane Smith',
                'Account Bank Name': 'HDFC Bank',
                'Account IFSC Code': 'HDFC0001234'
            }
        ];

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

        // Set column widths
        const columnWidths = [
            { wch: 20 }, // Name
            { wch: 30 }, // Email
            { wch: 15 }, // Phone
            { wch: 20 }, // Department
            { wch: 20 }, // Designation
            { wch: 12 }, // Salary
            { wch: 15 }, // Joining Date
            { wch: 30 }, // Qualification
            { wch: 12 }, // Experience
            { wch: 18 }, // Emergency Contact
            { wch: 15 }, // University Code
            { wch: 15 }, // Employee ID
            { wch: 12 }, // Status
            { wch: 15 }, // Date of Birth
            { wch: 10 }, // Gender
            { wch: 15 }, // Aadhar No
            { wch: 15 }, // State
            { wch: 30 }, // Permanent Address
            { wch: 15 }, // City
            { wch: 10 }, // Pincode
            { wch: 15 }, // Account Status
            { wch: 15 }, // Account Type
            { wch: 18 }, // Account Number
            { wch: 25 }, // Account Holder Name
            { wch: 25 }, // Account Bank Name
            { wch: 18 }  // Account IFSC Code
        ];
        worksheet['!cols'] = columnWidths;

        // Write to buffer
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=employee_template.xlsx');

        // Send buffer
        res.send(buffer);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating template',
            error: error.message
        });
    }
};

module.exports = {
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
};
