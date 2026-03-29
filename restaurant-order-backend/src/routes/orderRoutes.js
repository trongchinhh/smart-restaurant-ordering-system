const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    updateOrderStatus,
    updateOrderItemStatus,
    processPayment,
    getKitchenOrders,
    addItemsToOrder,
    getActiveOrderByTable,
    deleteOrderItem

} = require('../controllers/orderController');

// Public routes (for customers)
router.post('/public', validate.createOrder, createOrder);
router.get('/public/:id', getOrderById);
router.post('/public/:orderId/add-items', addItemsToOrder);
router.get('/table/:tableId/active', getActiveOrderByTable);
router.delete('/:orderId/items/:itemId', deleteOrderItem);
// Kitchen routes
router.get('/kitchen/queue', protect, authorize('kitchen', 'admin'), getKitchenOrders);

// Protected routes
router.use(protect);

router.route('/')
    .get(authorize('admin', 'manager', 'receptionist', 'kitchen'), getOrders)
    .post(authorize('admin', 'manager', 'receptionist'), validate.createOrder, createOrder);

router.route('/:id')
    .get(authorize('admin', 'manager', 'receptionist', 'kitchen'), getOrderById)
    .put(authorize('admin', 'manager', 'receptionist'), validate.createOrder, updateOrder);

router.patch('/:id/status', authorize('admin', 'manager', 'receptionist', 'kitchen'), validate.updateOrderStatus, updateOrderStatus);
router.post('/:id/payment', authorize('admin', 'manager', 'receptionist'), processPayment);
router.patch('/:orderId/items/:itemId', authorize('kitchen', 'admin', 'receptionist'), updateOrderItemStatus);
router.post('/:orderId/add-items', authorize('admin', 'manager', 'receptionist'), addItemsToOrder);
module.exports = router;