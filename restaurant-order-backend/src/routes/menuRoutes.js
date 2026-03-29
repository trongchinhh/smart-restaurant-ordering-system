const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { upload, processImage } = require('../middleware/upload');
const validate = require('../middleware/validate');
const {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateMenuItemStatus,
    bulkUpdateMenuItems
} = require('../controllers/menuController');

// Public routes
router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes
router.use(protect);

router.route('/')
    .post(
        authorize('admin', 'manager'),
        upload,
        processImage,
        validate.createMenuItem,
        createMenuItem
    );

router.route('/:id')
    .put(
        authorize('admin', 'manager'),
        upload,
        processImage,
        validate.createMenuItem,
        updateMenuItem
    )
    .delete(authorize('admin'), deleteMenuItem);

router.patch('/:id/status', authorize('admin', 'manager'), updateMenuItemStatus);
router.post('/bulk/update', authorize('admin', 'manager'), bulkUpdateMenuItems);

module.exports = router;