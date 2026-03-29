const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    createTakeawayQR,
    getTakeawayQRs,
    getTakeawayQRByCode,
    createTakeawayOrder,
    toggleTakeawayQR
} = require('../controllers/takeawayQRController');

// Public routes (cho khách hàng)
router.get('/public/:code', getTakeawayQRByCode);
router.post('/public/:code/order', createTakeawayOrder);

// Protected routes (cho admin)
router.use(protect);

router.route('/')
    .get(authorize('admin', 'manager', 'receptionist'), getTakeawayQRs)
    .post(authorize('admin', 'manager'), createTakeawayQR);

router.patch('/:id/toggle', authorize('admin', 'manager'), toggleTakeawayQR);

module.exports = router;