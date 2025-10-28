// University Configuration
const UNIVERSITY_CODES = {
    'GYAN001': {
        id: 'GYAN001',
        name: 'Kishangarh girls college',
    },
    'GYAN002': {
        id: 'GYAN002', 
        name: 'Kishangarh law college',
    }
};

// Helper function to get university by code
const getUniversityByCode = (code) => {
    return UNIVERSITY_CODES[code] || null;
};

// Helper function to get all universities
const getAllUniversities = () => {
    return Object.values(UNIVERSITY_CODES);
};

module.exports = {
    UNIVERSITY_CODES,
    getUniversityByCode,
    getAllUniversities
};
