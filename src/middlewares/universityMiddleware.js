const { getUniversityByCode } = require('../config/universityConfig');

// Middleware to validate university code in request
const validateUniversityCode = (req, res, next) => {
    const { universityCode } = req.body;
    
    if (universityCode && !getUniversityByCode(universityCode)) {
        return res.status(400).json({ 
            message: 'Invalid university code',
            availableCodes: ['GYAN001', 'GYAN002']
        });
    }
    
    next();
};

// Middleware to add university filter to query
const addUniversityFilter = (req, res, next) => {
    const userUniversityCode = req.user?.universityCode;
    
    if (userUniversityCode && req.user?.role === 'admin') {
        // Add university filter to request for database queries
        req.universityFilter = { universityCode: userUniversityCode };
    }
    
    next();
};

module.exports = {
    validateUniversityCode,
    addUniversityFilter
};
