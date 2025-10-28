const Session = require('../models/session');

// Create Session
const createSession = async (req, res) => {
    try {
        const sessionData = req.body;
        
        // Validate required fields
        const requiredFields = ['session_year', 'startDate', 'endDate'];
        const missingFields = requiredFields.filter(field => !sessionData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        // Validate session year
        if (sessionData.session_year < 2000 || sessionData.session_year > new Date().getFullYear() + 5) {
            return res.status(400).json({
                success: false,
                message: 'Session year must be between 2000 and ' + (new Date().getFullYear() + 5)
            });
        }

        // Check if session already exists
        const existingSession = await Session.findOne({ session_year: sessionData.session_year });
        if (existingSession) {
            return res.status(400).json({
                success: false,
                message: 'Session with this year already exists'
            });
        }

        // Set default values
        sessionData.status = sessionData.status || 'active';
        sessionData.totalStudents = sessionData.totalStudents || 0;
        sessionData.totalCourses = sessionData.totalCourses || 0;
        sessionData.totalFaculty = sessionData.totalFaculty || 0;
        sessionData.description = sessionData.description || '';

        // If this is being set as default, remove default from other sessions
        if (sessionData.is_default === true) {
            await Session.updateMany({}, { is_default: false });
        }

        const session = new Session(sessionData);
        await session.save();
        
        res.status(201).json({
            success: true,
            message: 'Session created successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating session',
            error: error.message
        });
    }
};

// Get All Sessions
const getAllSessions = async (req, res) => {
    try {
        const { is_default, page = 1, limit = 10 } = req.query;
        let filter = {};
        
        // Add filters
        if (is_default !== undefined) {
            filter.is_default = is_default === 'true';
        }

        const skip = (page - 1) * limit;
        
        const sessions = await Session.find(filter)
            .sort({ session_year: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Session.countDocuments(filter);
        
        res.status(200).json({
            success: true,
            message: 'Sessions retrieved successfully',
            count: sessions.length,
            total,
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: sessions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving sessions',
            error: error.message
        });
    }
};

// Get Session by ID
const getSessionById = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await Session.findById(id);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Session retrieved successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving session',
            error: error.message
        });
    }
};

// Update Session
const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Validate session year if provided
        if (updateData.session_year !== undefined) {
            if (updateData.session_year < 2000 || updateData.session_year > new Date().getFullYear() + 5) {
                return res.status(400).json({
                    success: false,
                    message: 'Session year must be between 2000 and ' + (new Date().getFullYear() + 5)
                });
            }

            // Check if session year already exists (excluding current session)
            const existingSession = await Session.findOne({ 
                session_year: updateData.session_year,
                _id: { $ne: id }
            });
            if (existingSession) {
                return res.status(400).json({
                    success: false,
                    message: 'Session with this year already exists'
                });
            }
        }

        // If this is being set as default, remove default from other sessions
        if (updateData.is_default === true) {
            await Session.updateMany({ _id: { $ne: id } }, { is_default: false });
        }

        const session = await Session.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Session updated successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating session',
            error: error.message
        });
    }
};

// Delete Session
const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if this is the default session
        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        if (session.is_default) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete default session. Please set another session as default first.'
            });
        }

        await Session.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Session deleted successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting session',
            error: error.message
        });
    }
};

// Get Default Session
const getDefaultSession = async (req, res) => {
    try {
        const defaultSession = await Session.findOne({ is_default: true });
        
        if (!defaultSession) {
            return res.status(404).json({
                success: false,
                message: 'No default session found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Default session retrieved successfully',
            data: defaultSession
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving default session',
            error: error.message
        });
    }
};

// Set Default Session
const setDefaultSession = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if session exists
        const session = await Session.findById(id);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found'
            });
        }

        // Remove default from all sessions
        await Session.updateMany({}, { is_default: false });

        // Set this session as default
        session.is_default = true;
        await session.save();
        
        res.status(200).json({
            success: true,
            message: 'Default session updated successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error setting default session',
            error: error.message
        });
    }
};

// Get Session by Year
const getSessionByYear = async (req, res) => {
    try {
        const { year } = req.params;
        const session = await Session.findOne({ session_year: parseInt(year) });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session not found for the given year'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Session retrieved successfully',
            data: session
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving session',
            error: error.message
        });
    }
};

// Get Recent Sessions
const getRecentSessions = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        
        const sessions = await Session.find({})
            .sort({ session_year: -1 })
            .limit(parseInt(limit));
        
        res.status(200).json({
            success: true,
            message: 'Recent sessions retrieved successfully',
            count: sessions.length,
            data: sessions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving recent sessions',
            error: error.message
        });
    }
};

// Get Sessions Statistics
const getSessionStatistics = async (req, res) => {
    try {
        const stats = await Session.aggregate([
            {
                $group: {
                    _id: null,
                    totalSessions: { $sum: 1 },
                    defaultSession: {
                        $sum: { $cond: ['$is_default', 1, 0] }
                    },
                    earliestSession: { $min: '$session_year' },
                    latestSession: { $max: '$session_year' }
                }
            }
        ]);
        
        const result = stats[0] || {
            totalSessions: 0,
            defaultSession: 0,
            earliestSession: null,
            latestSession: null
        };
        
        // Get default session details
        const defaultSession = await Session.findOne({ is_default: true });
        
        res.status(200).json({
            success: true,
            message: 'Session statistics retrieved successfully',
            data: {
                ...result,
                defaultSessionDetails: defaultSession
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving session statistics',
            error: error.message
        });
    }
};

module.exports = {
    createSession,
    getAllSessions,
    getSessionById,
    updateSession,
    deleteSession,
    getDefaultSession,
    setDefaultSession,
    getSessionByYear,
    getRecentSessions,
    getSessionStatistics
};
