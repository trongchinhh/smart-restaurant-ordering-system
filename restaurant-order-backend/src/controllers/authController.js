const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { Op } = require('sequelize');
const { getIO } = require('../config/socket');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        // Check if user exists
        const userExists = await User.findOne({
            where: {
                [Op.or]: [{ email }, { username }]
            }
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            full_name,
            role: role || 'receptionist'
        });

        // Generate token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                token
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Find user by username or email
        const user = await User.findOne({
            where: {
                [Op.or]: [
                    username ? { username } : null,
                    email ? { email } : null
                ].filter(Boolean)
            }
        });

        if (!user || !(await user.validatePassword(password))) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Update last login
        await user.update({ last_login: new Date() });

        // Generate token
        const token = generateToken(user.id);

        // Emit socket event for staff login
        const io = getIO();
        io.emit('user-login', {
            userId: user.id,
            username: user.username,
            role: user.role,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar: user.avatar,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { full_name, avatar } = req.body;

        const user = await User.findByPk(req.user.id);

        if (full_name) user.full_name = full_name;
        if (req.file) {
            user.avatar = req.file.url; // ✅ lấy từ middleware
        }

        await user.save();

        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!(await user.validatePassword(current_password))) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = new_password;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const io = getIO();
        io.emit('user-logout', {
            userId: req.user.id,
            username: req.user.username,
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false });

        await user.destroy();

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false });

        user.full_name = full_name || user.full_name;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();

        res.json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false });
    }
};
module.exports = {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    getUsers,
    deleteUser,
    updateUser

};