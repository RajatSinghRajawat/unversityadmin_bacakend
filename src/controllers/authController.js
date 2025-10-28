const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getUniversityByCode } = require('../config/universityConfig');

const register = async (req, res) => {
    try {
        const { name, email, password, role, universityCode } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate university code for non-superadmin users
        if (role !== 'superadmin' && !universityCode) {
            return res.status(400).json({ message: 'University code is required for admin users' });
        }

        if (role !== 'superadmin' && !getUniversityByCode(universityCode)) {
            return res.status(400).json({ message: 'Invalid university code' });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashpassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashpassword,
            role,
            universityCode: role !== 'superadmin' ? universityCode : undefined
        });

        const { password: _, ...userData } = newUser.toObject();

        return res.status(201).json({
            message: 'User created successfully',
            user: userData
        });
    } catch (error) {
        console.error("Register Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password, universityCode } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }
        
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // For admin users, validate university code
        if (user.role === 'admin') {
            if (!universityCode) {
                return res.status(400).json({ message: 'University code is required for admin login' });
            }
            
            if (user.universityCode !== universityCode) {
                return res.status(400).json({ message: 'Invalid university code for this admin' });
            }
        }

        // Get university info
        const universityInfo = user.universityCode ? getUniversityByCode(user.universityCode) : null;

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
                universityCode: user.universityCode,
                university: user.university ? user.university.toString() : null
            },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const { password: _, ...userData } = user.toObject();

        return res.status(200).json({ 
            success: true,
            message: 'Login successful', 
            token,
            user: userData,
            university: universityInfo
        });
    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

const logout = async (req, res) => {
    try {
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        console.error("Logout Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

const getadmin = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Get admin Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Get all available university codes
const getUniversityCodes = async (req, res) => {
    try {
        const { getAllUniversities } = require('../config/universityConfig');
        const universities = getAllUniversities();
        return res.status(200).json({ 
            message: 'University codes retrieved successfully',
            universities 
        });
    } catch (error) {
        console.error("Get University Codes Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}



module.exports = { register, login, logout, getadmin, getUniversityCodes };
