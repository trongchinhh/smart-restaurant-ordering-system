const express = require('express');
const router = express.Router();
const { protect, authorize, checkTableAccess } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    getTables,
    getTableById,
    createTable,
    updateTable,
    deleteTable,
    generateQRCode,
    updateTableStatus
} = require('../controllers/tableController');

// Public routes (for customers scanning QR)
router.get('/public/:id', getTableById);

// Protected routes
router.use(protect);

router.route('/')
    .get(authorize('admin', 'manager', 'receptionist'), getTables)
    .post(authorize('admin', 'manager'), validate.createTable, createTable);

router.route('/:id')
    .get(checkTableAccess, getTableById)
    .put(authorize('admin', 'manager'), validate.createTable, updateTable)
    .delete(authorize('admin'), deleteTable);

router.get('/:id/qr', authorize('admin', 'manager'), generateQRCode);
router.patch('/:id/status', authorize('admin', 'manager', 'receptionist'), updateTableStatus);

module.exports = router;