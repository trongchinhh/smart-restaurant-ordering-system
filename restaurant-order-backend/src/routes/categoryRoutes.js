const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

// Public routes
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected routes
router.use(protect);

router.post('/', authorize('admin', 'manager'), validate.createCategory, createCategory);
router.put('/:id', authorize('admin', 'manager'), validate.createCategory, updateCategory);
router.delete('/:id', authorize('admin'), deleteCategory);

module.exports = router;