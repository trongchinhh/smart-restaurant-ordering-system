const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
    getDashboardStats,
    getRevenueStats,
    getProductStats,
    getOrderStats
} = require('../controllers/statisticController');

router.use(protect);
router.use(authorize('admin', 'manager'));

router.get('/dashboard', getDashboardStats);
router.get('/revenue', getRevenueStats);
router.get('/products', getProductStats);
router.get('/orders', getOrderStats);

module.exports = router;