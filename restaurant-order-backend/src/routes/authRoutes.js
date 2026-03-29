const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload, processImage } = require('../middleware/upload');
const {
    register,
    login,
    getMe,
    updateProfile,
    changePassword,
    logout,
    getUsers,
    deleteUser,
    updateUser
} = require('../controllers/authController');

// Public routes
router.post('/register', validate.register, register);
router.post('/login', validate.login, login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.put('/users/:id', protect, updateUser);
router.delete('/users/:id', protect, deleteUser);
router.put(
    '/profile',
    protect,
    upload,          // 👈 multer phải đứng trước
    processImage,    // 👈 xử lý ảnh
    updateProfile    // 👈 controller cuối cùng
);
router.put('/change-password', protect, changePassword);
router.post('/logout', protect, logout);

module.exports = router;