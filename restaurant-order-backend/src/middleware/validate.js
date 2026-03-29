const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

// Validation rules
const validate = {
    // User validation
    register: [
        body('username')
            .trim()
            .isLength({ min: 3, max: 50 })
            .withMessage('Username must be between 3 and 50 characters')
            .matches(/^[a-zA-Z0-9_]+$/)
            .withMessage('Username can only contain letters, numbers and underscores'),
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters')
            .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
            .withMessage('Password must contain at least one letter and one number'),
        body('full_name')
            .trim()
            .notEmpty()
            .withMessage('Full name is required')
            .isLength({ max: 100 }),
        handleValidationErrors
    ],

    login: [
        body('username').optional().trim().notEmpty(),
        body('email').optional().trim().isEmail(),
        body('password').notEmpty().withMessage('Password is required'),
        handleValidationErrors
    ],

    // Table validation
    createTable: [
        body('table_number')
            .trim()
            .notEmpty()
            .withMessage('Table number is required')
            .isLength({ max: 10 }),
        body('capacity')
            .optional()
            .isInt({ min: 1, max: 20 })
            .withMessage('Capacity must be between 1 and 20'),
        body('location')
            .optional()
            .isIn(['inside', 'outside', 'vip'])
            .withMessage('Invalid location'),
        handleValidationErrors
    ],

    // Category validation
    createCategory: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Category name is required')
            .isLength({ max: 100 }),
        body('sort_order')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Sort order must be a positive number'),
        handleValidationErrors
    ],

    // Menu item validation
    createMenuItem: [
        body('name')
            .trim()
            .notEmpty()
            .withMessage('Item name is required')
            .isLength({ max: 200 }),
        body('price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),
        body('category_id')
            .notEmpty()
            .withMessage('Category is required')
            .isUUID()
            .withMessage('Invalid category ID'),
        body('preparation_time')
            .optional()
            .isInt({ min: 1, max: 120 })
            .withMessage('Preparation time must be between 1 and 120 minutes'),
        handleValidationErrors
    ],


    // Order validation
    createOrder: [
        body('table_id')
            .notEmpty()
            .withMessage('Table ID is required')
            .isUUID()
            .withMessage('Invalid table ID'),
        body('items')
            .isArray({ min: 1 })
            .withMessage('At least one item is required'),
        body('items.*.menu_item_id')
            .notEmpty()
            .isUUID(),
        body('items.*.quantity')
            .isInt({ min: 1 })
            .withMessage('Quantity must be at least 1'),
        handleValidationErrors
    ],

    updateOrderStatus: [
        body('status')
            .isIn(['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled', 'paid'])
            .withMessage('Invalid status'),
        handleValidationErrors
    ]
};

module.exports = validate;