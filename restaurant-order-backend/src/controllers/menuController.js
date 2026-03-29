const { MenuItem, Category, OrderItem } = require('../models');
const { getIO } = require('../config/socket');
const { Op } = require('sequelize');
const { sequelize } = require('../models');
//const { Op } = require('sequelize');
const fs = require('fs');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
const getMenuItems = async (req, res) => {
    try {
        const {
            category_id,
            status,
            is_recommended,
            is_new,
            search,
            discount,
            bestseller,
            min_price,
            max_price,
            sort_price,
            page = 1,
            limit = 10
        } = req.query;

        const where = {};

        if (category_id) where.category_id = category_id;
        if (status) where.status = status;
        if (is_recommended) where.is_recommended = is_recommended === 'true';
        if (is_new) where.is_new = is_new === 'true';
        if (discount === 'true') where.discount_price = { [Op.gt]: 0 };

        // 🔥 FILTER GIÁ
        if ((min_price !== undefined && min_price !== '') || (max_price !== undefined && max_price !== '')) {
            const min = min_price ? Number(min_price) : 0;
            const max = max_price ? Number(max_price) : 999999999;
            where[Op.and] = [
                ...(where[Op.and] || []),
                sequelize.literal(`(
                    CASE 
                        WHEN discount_price IS NOT NULL AND discount_price > 0 
                        THEN discount_price 
                        ELSE price 
                    END
                ) BETWEEN ${min} AND ${max}`)
            ];
        }

        // 🔍 SEARCH
        if (search) {
            where[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { name_en: { [Op.like]: `%${search}%` } }
            ];
        }

        // 🔥 ORDER
        let order = [];

        if (bestseller === 'true') {

            // luôn ưu tiên còn hàng
            order.push([sequelize.literal(`status = 'available'`), 'DESC']);

            // SORT GIÁ nếu có
            if (sort_price === 'asc') {
                order.push([
                    sequelize.literal(`(
                        CASE 
                            WHEN discount_price IS NOT NULL AND discount_price > 0 
                            THEN discount_price 
                            ELSE price 
                        END
                    )`),
                    'ASC'
                ]);
            } else if (sort_price === 'desc') {
                order.push([
                    sequelize.literal(`(
                        CASE 
                            WHEN discount_price IS NOT NULL AND discount_price > 0 
                            THEN discount_price 
                            ELSE price 
                        END
                    )`),
                    'DESC'
                ]);
            }

            // fallback: bán chạy
            order.push([sequelize.literal('total_sold'), 'DESC']);

            // 🔥 LẤY TOP 5 bán chạy THẬT SỰ trước
            const topItems = await MenuItem.findAll({
                attributes: [
                    'id',
                    [
                        sequelize.literal(`(
                            SELECT COALESCE(SUM(oi.quantity), 0) 
                            FROM order_items oi
                            JOIN orders o ON oi.order_id = o.id
                            WHERE oi.menu_item_id = MenuItem.id
                            AND o.payment_status = 'paid'
                            AND o.status != 'cancelled'
                        )`),
                        'total_sold'
                    ]
                ],
                order: [[sequelize.literal('total_sold'), 'DESC']],
                limit: 5,
                raw: true
            });

            const topIds = topItems.map(item => item.id);

            if (topIds.length === 0) {
                return res.json({
                    success: true,
                    data: [],
                    pagination: { total: 0, page: 1, pages: 1 }
                });
            }

            // LẤY DATA THẬT + filter trong top 5
            rows = await MenuItem.findAll({
                where: { ...where, id: { [Op.in]: topIds } },
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COALESCE(SUM(oi.quantity), 0) 
                                FROM order_items oi
                                JOIN orders o ON oi.order_id = o.id
                                WHERE oi.menu_item_id = MenuItem.id
                                AND o.payment_status = 'paid'
                                AND o.status != 'cancelled'
                            )`),
                            'total_sold'
                        ]
                    ]
                },
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name', 'name_en']
                    }
                ],
                order
            });

            total = rows.length;

        } else {
            // TAB THƯỜNG
            order.push([sequelize.literal(`status = 'available'`), 'DESC']);
            if (sort_price === 'asc') {
                order.push([
                    sequelize.literal(`(
                        CASE 
                            WHEN discount_price IS NOT NULL AND discount_price > 0 
                            THEN discount_price 
                            ELSE price 
                        END
                    )`),
                    'ASC'
                ]);
            } else if (sort_price === 'desc') {
                order.push([
                    sequelize.literal(`(
                        CASE 
                            WHEN discount_price IS NOT NULL AND discount_price > 0 
                            THEN discount_price 
                            ELSE price 
                        END
                    )`),
                    'DESC'
                ]);
            } else {
                order.push([sequelize.literal('total_sold > 0'), 'DESC']);
                order.push([sequelize.literal('total_sold'), 'DESC']);
                order.push(['sort_order', 'ASC']);
            }

            rows = await MenuItem.findAll({
                where,
                limit: parseInt(limit),
                offset: (page - 1) * limit,
                attributes: {
                    include: [
                        [
                            sequelize.literal(`(
                                SELECT COALESCE(SUM(oi.quantity), 0) 
                                FROM order_items oi
                                JOIN orders o ON oi.order_id = o.id
                                WHERE oi.menu_item_id = MenuItem.id
                                AND o.payment_status = 'paid'
                                AND o.status != 'cancelled'
                            )`),
                            'total_sold'
                        ]
                    ]
                },
                include: [
                    {
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name', 'name_en']
                    }
                ],
                order,
                subQuery: false
            });

            total = await MenuItem.count({ where });
        }

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                pages: bestseller === 'true' ? 1 : Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findByPk(req.params.id, {
            include: [
                {
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name', 'name_en']
                }
            ]
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        res.json({
            success: true,
            data: item
        });
    } catch (error) {
        console.error('Get menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private/Admin
const createMenuItem = async (req, res) => {
    try {
        const {
            name, name_en, description, price, discount_price,
            ingredients, allergens, preparation_time, status,
            is_recommended, is_new, sort_order, category_id,
            size_prices,
            options
        } = req.body;

        // Check category exists
        const category = await Category.findByPk(category_id);
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category not found'
            });
        }

        const image_url = req.file ? req.file.url : null;

        const menuItem = await MenuItem.create({
            name,
            name_en,
            description,
            price,
            discount_price: discount_price || null,
            ingredients: ingredients ? JSON.parse(ingredients) : [],
            allergens: allergens ? JSON.parse(allergens) : [],
            preparation_time: preparation_time || 15,
            status: status || 'available',
            is_recommended: is_recommended || false,
            is_new: is_new || false,
            sort_order: sort_order || 0,
            category_id,
            image_url,
            size_prices: size_prices ? JSON.parse(size_prices) : null,
            options: options ? JSON.parse(options) : null,
            created_by: req.user.id
        });

        const io = getIO();
        io.emit('menu-item-created', menuItem);

        res.status(201).json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Create menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Admin
const updateMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        const {
            name, name_en, description, price, discount_price,
            ingredients, allergens, preparation_time, status,
            is_recommended, is_new, sort_order, category_id, size_prices,
            options
        } = req.body;

        // Check new category if provided
        if (category_id) {
            const category = await Category.findByPk(category_id);
            if (!category) {
                return res.status(400).json({
                    success: false,
                    message: 'Category not found'
                });
            }
        }
        if (req.body.removeImage) {
            if (menuItem.image_url) {
                const oldImagePath = menuItem.image_url.replace(/^\//, '');

                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            menuItem.image_url = null;
        }
        // Handle image update
        if (req.file) {

            // Delete old image if exists
            if (menuItem.image_url) {
                const oldImagePath = menuItem.image_url.replace(/^\//, '');
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            menuItem.image_url = req.file.url;
        }

        await menuItem.update({
            name: name || menuItem.name,
            name_en: name_en !== undefined ? name_en : menuItem.name_en,
            description: description !== undefined ? description : menuItem.description,
            price: price || menuItem.price,
            discount_price: discount_price !== undefined ? discount_price : menuItem.discount_price,
            ingredients: ingredients ? JSON.parse(ingredients) : menuItem.ingredients,
            allergens: allergens ? JSON.parse(allergens) : menuItem.allergens,
            preparation_time: preparation_time || menuItem.preparation_time,
            status: status || menuItem.status,
            is_recommended: is_recommended !== undefined ? is_recommended : menuItem.is_recommended,
            is_new: is_new !== undefined ? is_new : menuItem.is_new,
            sort_order: sort_order !== undefined ? sort_order : menuItem.sort_order,
            category_id: category_id || menuItem.category_id,
            image_url: menuItem.image_url,
            size_prices: size_prices ? JSON.parse(size_prices) : menuItem.size_prices,
            options: options ? JSON.parse(options) : menuItem.options,
        });

        const io = getIO();
        io.emit('menu-item-updated', menuItem);

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Update menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Admin
const deleteMenuItem = async (req, res) => {
    try {
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        // Check if item has orders
        const orderCount = await OrderItem.count({
            where: { menu_item_id: menuItem.id }
        });

        if (orderCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete menu item with existing orders'
            });
        }

        // Delete image file
        if (menuItem.image_url) {
            const imagePath = menuItem.image_url.replace(/^\//, '');
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await menuItem.destroy();

        const io = getIO();
        io.emit('menu-item-deleted', { id: req.params.id });

        res.json({
            success: true,
            message: 'Menu item deleted successfully'
        });
    } catch (error) {
        console.error('Delete menu item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update menu item status
// @route   PATCH /api/menu/:id/status
// @access  Private/Admin
const updateMenuItemStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const menuItem = await MenuItem.findByPk(req.params.id);

        if (!menuItem) {
            return res.status(404).json({
                success: false,
                message: 'Menu item not found'
            });
        }

        await menuItem.update({ status });

        const io = getIO();
        io.emit('menu-item-status-updated', {
            id: menuItem.id,
            status,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: menuItem
        });
    } catch (error) {
        console.error('Update menu item status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Bulk update menu items
// @route   POST /api/menu/bulk
// @access  Private/Admin
const bulkUpdateMenuItems = async (req, res) => {
    try {
        const { items } = req.body;

        const updates = [];
        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.id);
            if (menuItem) {
                await menuItem.update(item);
                updates.push(menuItem);
            }
        }

        const io = getIO();
        io.emit('menu-items-bulk-updated', updates);

        res.json({
            success: true,
            data: updates,
            message: `Updated ${updates.length} items`
        });
    } catch (error) {
        console.error('Bulk update menu items error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    updateMenuItemStatus,
    bulkUpdateMenuItems
};