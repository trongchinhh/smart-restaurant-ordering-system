const { Order, OrderItem, Table, MenuItem, User } = require('../models');
const { getIO } = require('../config/socket');
const { sequelize } = require('../models');
const { Op } = require('sequelize');
const socketEvents = require('../utils/socketEvents')
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const {
            status,
            payment_status,
            table_id,
            table_number,      // Thêm filter theo số bàn
            start_date,
            end_date,
            today_only,        // Thêm filter chỉ lấy đơn hôm nay
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        // Lọc theo trạng thái
        if (status) where.status = status;

        // Lọc theo trạng thái thanh toán
        if (payment_status) where.payment_status = payment_status;

        // Lọc theo bàn (theo ID)
        if (table_id) where.table_id = table_id;

        // Xử lý lọc theo ngày
        if (today_only === 'true') {
            // Lấy ngày hôm nay (từ 00:00:00 đến 23:59:59)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            where.createdAt = {
                [Op.gte]: today,
                [Op.lt]: tomorrow
            };
        } else if (start_date || end_date) {
            where.createdAt = {};
            if (start_date) where.createdAt[Op.gte] = new Date(start_date);
            if (end_date) where.createdAt[Op.lte] = new Date(end_date);
        }

        // Lọc theo role (dành cho nhân viên bếp)
        if (req.user.role === 'kitchen') {
            where.status = { [Op.in]: ['confirmed', 'preparing', 'ready'] };
        }

        const offset = (page - 1) * limit;

        // Xây dựng include options với filter theo số bàn
        const include = [
            {
                model: Table,
                as: 'table',
                attributes: ['id', 'table_number', 'capacity', 'location'],
                // Nếu có table_number thì thêm điều kiện where
                ...(table_number && {
                    where: { table_number: table_number }
                })
            },
            {
                model: User,
                as: 'creator',
                attributes: ['id', 'username', 'full_name']
            },
            {
                model: OrderItem,
                as: 'items',
                include: [
                    {
                        model: MenuItem,
                        as: 'menuItem',
                        attributes: ['id', 'name', 'price', 'image_url']
                    }
                ]
            }
        ];

        const orders = await Order.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [
                ['priority', 'DESC'],
                ['createdAt', 'DESC']
            ],
            include,
            distinct: true  // Quan trọng để phân trang chính xác khi có includes
        });

        res.json({
            success: true,
            data: orders.rows,
            pagination: {
                total: orders.count,
                page: parseInt(page),
                pages: Math.ceil(orders.count / limit)
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number', 'capacity', 'location']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: User,
                    as: 'updater',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price', 'image_url', 'preparation_time']
                        }
                    ]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Create order
// @route   POST /api/orders
// @access  Public/Private
// @desc    Create order
// @route   POST /api/orders
// @access  Public/Private
const createOrder = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const {
            order_type = 'dine_in',
            table_id,
            customer_name,
            customer_phone,
            customer_address,
            customer_count,
            items,
            note
        } = req.body;

        // Validate based on order type
        if (order_type === 'dine_in' && !table_id) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Table ID is required for dine-in orders'
            });
        }

        if (order_type === 'delivery' && !customer_address) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Delivery address is required'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Items are required'
            });
        }

        // Check table if dine-in
        let table = null;
        if (table_id) {
            table = await Table.findByPk(table_id, { transaction: t });
            if (!table) {
                await t.rollback();
                return res.status(404).json({
                    success: false,
                    message: 'Table not found'
                });
            }
        }

        // Calculate totals
        let subtotal = 0;
        let totalPreparationTime = 0;
        const orderItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.menu_item_id, {
                transaction: t
            });

            if (!menuItem) {
                await t.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found`
                });
            }

            if (menuItem.status !== 'available') {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is not available`
                });
            }

            const quantity = item.quantity || 1;

            // 1. Tính giá cơ bản (có thể theo size)
            let basePrice = parseFloat(menuItem.discount_price || menuItem.price);

            if (item.options?.size && menuItem.size_prices) {
                const sizePrice = menuItem.size_prices[item.options.size];
                if (sizePrice) {
                    basePrice = parseFloat(sizePrice);
                }
            }

            // 2. Tính tiền từ các thành phần được chọn (ingredients)
            let ingredientsTotal = 0;
            const selectedIngredients = [];

            // Lấy selectedIngredients từ item.options (vì giờ nó nằm trong options)
            if (item.options?.selectedIngredients && Array.isArray(item.options.selectedIngredients)) {
                // Tính tổng tiền từ các ingredient được chọn
                item.options.selectedIngredients.forEach(selected => {
                    const ingredientPrice = (selected.price || 0) * (selected.quantity || 1);
                    ingredientsTotal += ingredientPrice;

                    selectedIngredients.push({
                        name: selected.name,
                        quantity: selected.quantity || 1,
                        price: selected.price || 0,
                        total: ingredientPrice
                    });
                });
            }

            // // 3. Xử lý các toppings riêng (nếu có - cho đồ uống)
            // let toppingsTotal = 0;
            // if (item.options?.toppings && Array.isArray(item.options.toppings)) {
            //     // Giả sử toppings có cấu hình giá riêng
            //     item.options.toppings.forEach(topping => {
            //         if (typeof topping === 'object') {
            //             toppingsTotal += parseFloat(topping.price || 0) * (topping.quantity || 1);
            //         }
            //     });
            // }

            // 4. Tính tổng tiền cho item này
            // Giá cơ bản * số lượng + tiền ingredients + tiền toppings
            const itemSubtotal = (basePrice * quantity) + ingredientsTotal;

            // Cập nhật tổng đơn hàng
            subtotal += itemSubtotal;

            // Tính thời gian chuẩn bị (lấy max)
            totalPreparationTime = Math.max(
                totalPreparationTime,
                menuItem.preparation_time
            );

            // Tạo options hoàn chỉnh để lưu
            const itemOptions = {
                ...item.options,
                order_type: item.options?.order_type || 'dine_in',
                // Lưu thông tin ingredients đã chọn
                selectedIngredients: selectedIngredients,
                ingredientsTotal: ingredientsTotal,
                // Lưu thông tin toppings (cho đồ uống)
                // toppings: item.options?.toppings || [],
                // toppingsTotal: toppingsTotal,
                // Lưu size đã chọn
                size: item.options?.size || null,
                // Lưu thông tin khác (đường, đá...)
                sugar: item.options?.sugar || null,
                ice: item.options?.ice || null,
                spiceLevel: item.options?.spiceLevel || null
            };

            orderItems.push({
                menu_item_id: menuItem.id,
                menuItemName: menuItem.name,
                quantity: quantity,
                unit_price: basePrice, // Giá cơ bản (chưa bao gồm ingredients)
                subtotal: itemSubtotal, // Tổng tiền (đã bao gồm ingredients)
                note: item.note || '',
                options: itemOptions,
                status: 'pending',
                // Thêm trường để lưu chi tiết ingredients (có thể dùng sau này)
                ingredients_detail: selectedIngredients
            });
        }

        // Generate order number
        const generateOrderNumber = () => {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(1000 + Math.random() * 9000);
            return `ORD-${date}-${random}`;
        };

        // Tính thuế (có thể cấu hình税率 khác nhau)
        const taxRate = 0.1; // 10%
        const tax = Number((subtotal * taxRate).toFixed(2));
        const total = Number((subtotal + tax).toFixed(2));

        // Create order
        const orderData = {
            order_number: generateOrderNumber(),
            order_type,
            table_id: table_id || null,
            customer_name: customer_name || 'Khách',
            customer_phone: customer_phone || '',
            customer_address: customer_address || '',
            customer_count: customer_count || 1,
            subtotal,
            tax: tax,
            total: total,
            note: note || '',
            estimated_time: totalPreparationTime,
            status: 'pending',
            payment_status: 'unpaid',
            is_parent_order: true
        };

        const order = await Order.create(orderData, { transaction: t });

        // Create order items
        for (const item of orderItems) {
            await OrderItem.create({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
                note: item.note,
                options: item.options || null,
                order_type: item.options?.order_type || 'dine_in', // 🔥 thêm dòng này
                status: 'pending'
            }, { transaction: t });
        }

        // Update table status if dine-in
        if (table && order_type === 'dine_in') {
            await table.update({ status: 'occupied' }, { transaction: t });
        }

        await t.commit();

        // Fetch complete order với đầy đủ thông tin
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number', 'status']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price', 'image_url', 'preparation_time']
                        }
                    ]
                }
            ]
        });

        // Format order items để hiển thị chi tiết ingredients
        const formattedItems = orderItems.map(item => {
            const selectedIngredients = item.options?.selectedIngredients || [];
            const ingredientsText = selectedIngredients.length > 0
                ? selectedIngredients.map(ing => `${ing.name} x${ing.quantity} (+${formatCurrency(ing.total)})`).join(', ')
                : '';

            return {
                name: item.menuItemName,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                subtotal: item.subtotal,
                note: item.note,
                ingredients: selectedIngredients,
                ingredientsText: ingredientsText,
                options: item.options
            };
        });

        // Emit socket events
        const io = getIO();

        // Gửi cho lễ tân
        io.to('reception-staff').emit('new-order', {
            message: 'Có đơn hàng mới!',
            order: completeOrder,
            orderType: order_type,
            tableNumber: table?.table_number,
            timestamp: new Date()
        });

        // Gửi cho bếp - kèm thông tin chi tiết ingredients
        io.to('kitchen-staff').emit('kitchen-new-order', {

            orderId: order.id,
            orderNumber: order.order_number,
            status: 'pending',
            orderType: order_type,
            tableNumber: table?.table_number,
            items: formattedItems.map(item => ({
                name: item.name,
                quantity: item.quantity,
                note: item.note,
                ingredients: item.ingredientsText,
                spiceLevel: item.options?.spiceLevel,
                size: item.options?.size
            })),
            estimatedTime: totalPreparationTime,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: {
                ...completeOrder.toJSON(),
                items: formattedItems
            },
            message: 'Tạo đơn hàng thành công'
        });

    } catch (error) {
        await t.rollback();
        console.error('❌ Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Helper function để format currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};
// @desc    Add items to existing order (gọi thêm món)
// @route   POST /api/orders/:orderId/add-items
// @access  Public/Private
const addItemsToOrder = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { orderId } = req.params;
        const { items, note } = req.body;

        // Find parent order
        const parentOrder = await Order.findByPk(orderId, {
            include: ['table'],
            transaction: t
        });

        if (!parentOrder) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be modified
        if (['completed', 'cancelled', 'paid'].includes(parentOrder.status)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot add items to ${parentOrder.status} order`
            });
        }

        // Calculate new items
        let subtotal = 0;
        let totalPreparationTime = 0;
        const newItems = [];

        for (const item of items) {
            const menuItem = await MenuItem.findByPk(item.menu_item_id, {
                transaction: t
            });

            if (!menuItem) {
                await t.rollback();
                return res.status(404).json({
                    success: false,
                    message: `Menu item not found`
                });
            }

            if (menuItem.status !== 'available') {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} is not available`
                });
            }
            const quantity = item.quantity || 1;

            let price = menuItem.discount_price || menuItem.price;

            if (item.options?.size && menuItem.size_prices) {
                const sizePrice = menuItem.size_prices[item.options.size];
                if (sizePrice) {
                    price = sizePrice;
                }
            }

            // 2. Tính tiền từ các thành phần được chọn (ingredients)
            let ingredientsTotal = 0;
            const selectedIngredients = [];

            // Lấy selectedIngredients từ item.options (vì giờ nó nằm trong options)
            if (item.options?.selectedIngredients && Array.isArray(item.options.selectedIngredients)) {
                // Tính tổng tiền từ các ingredient được chọn
                item.options.selectedIngredients.forEach(selected => {
                    const ingredientPrice = (selected.price || 0) * (selected.quantity || 1);
                    ingredientsTotal += ingredientPrice;

                    selectedIngredients.push({
                        name: selected.name,
                        quantity: selected.quantity || 1,
                        price: selected.price || 0,
                        total: ingredientPrice
                    });
                });
            }

            // // 3. Xử lý các toppings riêng (nếu có - cho đồ uống)
            // let toppingsTotal = 0;
            // if (item.options?.toppings && Array.isArray(item.options.toppings)) {
            //     // Giả sử toppings có cấu hình giá riêng
            //     item.options.toppings.forEach(topping => {
            //         if (typeof topping === 'object') {
            //             toppingsTotal += parseFloat(topping.price || 0) * (topping.quantity || 1);
            //         }
            //     });
            // }

            // 4. Tính tổng tiền cho item này
            // Giá cơ bản * số lượng + tiền ingredients + tiền toppings
            const itemSubtotal = (price * quantity) + ingredientsTotal;

            // Cập nhật tổng đơn hàng
            subtotal += itemSubtotal;
            totalPreparationTime = Math.max(
                totalPreparationTime,
                menuItem.preparation_time
            );

            newItems.push({
                order_id: parentOrder.id,
                menu_item_id: menuItem.id,
                menuItemName: menuItem.name, // ✅ Thêm tên món
                quantity: quantity,
                unit_price: price,
                subtotal: itemSubtotal,
                note: item.note || '',
                options: {
                    ...item.options,
                    order_type: item.options?.order_type || 'dine_in' // 🔥 thêm dòng này
                },
                order_type: item.options?.order_type || 'dine_in', // 🔥 nếu bạn đã thêm field vào DB
                status: 'pending',
                is_new: true
            });
        }

        // Create new order items
        await OrderItem.bulkCreate(newItems, { transaction: t });

        // Update parent order totals
        const newSubtotal = parseFloat(parentOrder.subtotal) + subtotal;
        await parentOrder.update({
            subtotal: newSubtotal,
            tax: Number((newSubtotal * 0.1).toFixed(2)),
            total: Number((newSubtotal * 1.1).toFixed(2)),
            estimated_time: Math.max(parentOrder.estimated_time || 0, totalPreparationTime),
            note: note ? `${parentOrder.note || ''}\n[Thêm] ${note}` : parentOrder.note,
            status: 'pending'
        }, { transaction: t });

        await t.commit();

        // Fetch updated order
        const updatedOrder = await Order.findByPk(parentOrder.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price']
                        }
                    ]
                }
            ]
        });

        // Emit socket events
        const io = getIO();
        io.to('reception-staff').emit('order-updated', {
            message: 'Đơn hàng được thêm món',
            order: updatedOrder,
            newItems: newItems.length,
            timestamp: new Date()
        });

        io.to('kitchen-staff').emit('kitchen-add-items', {

            isNewItems: true,
            status: 'pending',
            orderId: parentOrder.id,
            orderNumber: parentOrder.order_number,
            tableNumber: parentOrder.table?.table_number,
            items: newItems.map(item => ({
                name: item.menuItemName,
                quantity: item.quantity,
                note: item.note,
                orderType: item.order_type // 🔥 thêm
            })),
            estimatedTime: totalPreparationTime,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: updatedOrder,
            message: `Đã thêm ${newItems.length} món vào đơn hàng`
        });

    } catch (error) {
        await t.rollback();
        console.error('Add items to order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get active order by table
// @route   GET /api/orders/table/:tableId/active
// @access  Public
const getActiveOrderByTable = async (req, res) => {
    try {

        const { tableId } = req.params;

        const order = await Order.findOne({
            where: {
                table_id: tableId,
                payment_status: { [Op.ne]: 'paid' },
                status: {
                    [Op.notIn]: ['cancelled', 'completed']
                }
            },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price']
                        }
                    ]
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No active order for this table'
            });
        }

        res.json({
            success: true,
            data: order
        });

    } catch (error) {
        console.error('Get active order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const order = await Order.findByPk(req.params.id, {
            include: ['items'],
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Check if order can be updated
        if (['completed', 'paid', 'cancelled'].includes(order.status)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot update order with status: ${order.status}`
            });
        }

        const {
            customer_name,
            customer_phone,
            customer_count,
            items,
            note,
            special_requests
        } = req.body;

        // Update basic info
        if (customer_name) order.customer_name = customer_name;
        if (customer_phone) order.customer_phone = customer_phone;
        if (customer_count) order.customer_count = customer_count;
        if (note !== undefined) order.note = note;
        if (special_requests !== undefined) order.special_requests = special_requests;

        order.updated_by = req.user.id;

        // Update items if provided
        if (items) {
            // Delete existing items
            await OrderItem.destroy({
                where: { order_id: order.id },
                transaction: t
            });

            // Recalculate totals
            let subtotal = 0;
            let totalPreparationTime = 0;
            const newItems = [];

            for (const item of items) {
                const menuItem = await MenuItem.findByPk(item.menu_item_id, {
                    transaction: t
                });

                if (!menuItem) {
                    await t.rollback();
                    return res.status(404).json({
                        success: false,
                        message: `Menu item ${item.menu_item_id} not found`
                    });
                }

                const price = menuItem.discount_price || menuItem.price;
                const itemSubtotal = price * item.quantity;

                subtotal += itemSubtotal;
                totalPreparationTime = Math.max(
                    totalPreparationTime,
                    menuItem.preparation_time
                );

                newItems.push({
                    order_id: order.id,
                    menu_item_id: menuItem.id,
                    quantity: item.quantity,
                    unit_price: price,
                    subtotal: itemSubtotal,
                    note: item.note,
                    special_requests: item.special_requests,
                    preparation_time: menuItem.preparation_time
                });
            }

            // Create new items
            await OrderItem.bulkCreate(newItems, { transaction: t });

            // Update order totals
            order.subtotal = subtotal;
            order.tax = subtotal * 0.1;
            order.total = subtotal * 1.1;
            order.estimated_time = totalPreparationTime;
        }

        await order.save({ transaction: t });
        await t.commit();

        // Fetch updated order
        const updatedOrder = await Order.findByPk(order.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: ['menuItem']
                }
            ]
        });

        // Emit socket event
        const io = getIO();
        io.to('reception-staff').emit('order-updated', updatedOrder);
        io.to('kitchen-staff').emit('kitchen-order-updated', updatedOrder);

        res.json({
            success: true,
            data: updatedOrder
        });
    } catch (error) {
        await t.rollback();
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: ['menuItem']
                }
            ]
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update order status
        await order.update({
            status,
            updated_by: req.user.id,
            completed_at: status === 'completed' ? new Date() : order.completed_at
        });

        // ADD THIS: Handle cancelled status to free the table
        if (status === 'cancelled') {
            // Kiểm tra xem có order nào khác trên bàn này không
            const otherOrders = await Order.count({
                where: {
                    table_id: order.table_id,
                    id: { [Op.ne]: order.id },
                    payment_status: { [Op.ne]: 'paid' },
                    status: { [Op.notIn]: ['cancelled', 'completed'] }
                }
            });

            // Nếu không còn order nào khác, cập nhật bàn thành available
            if (otherOrders === 0 && order.table_id) {
                await Table.update(
                    { status: 'available' },
                    { where: { id: order.table_id } }
                );

                // Emit socket event để cập nhật trạng thái bàn
                const io = getIO();
                io.emit('table-status-updated', {
                    tableId: order.table_id,
                    tableNumber: order.table?.table_number,
                    status: 'available',
                    timestamp: new Date()
                });
            }
        }

        // If order paid, free table (keep existing logic)
        if (status === 'paid') {
            const activeOrders = await Order.count({
                where: {
                    table_id: order.table_id,
                    payment_status: { [Op.ne]: 'paid' }
                }
            });

            if (activeOrders === 0) {
                await Table.update(
                    { status: 'available' },
                    { where: { id: order.table_id } }
                );
            }
        }

        // Update order items status based on order status
        if (status === 'confirmed') {
            await OrderItem.update(
                { is_new: false },
                {
                    where: {
                        order_id: order.id,
                        is_new: true
                    }
                }
            );
        } else if (status === 'preparing') {
            await OrderItem.update(
                { status: 'preparing', is_new: false },
                {
                    where: {
                        order_id: order.id,
                        status: 'pending'
                    }
                }
            );
        } else if (status === 'ready') {
            await OrderItem.update(
                { status: 'ready', is_new: false },
                { where: { order_id: order.id, status: { [Op.ne]: 'cancelled' } } }
            );
        } else if (status === 'served') {
            await OrderItem.update(
                { status: 'served', is_new: false },
                { where: { order_id: order.id, status: { [Op.ne]: 'cancelled' } } }
            );
        }

        // Emit socket events
        const io = getIO();
        io.to('reception-staff').emit('order-status-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            status,
            tableNumber: order.table.table_number,
            timestamp: new Date()
        });

        // emit đúng event mà kitchen page đang nghe
        io.to('kitchen-staff').emit('kitchen-order-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            status,
            items: order.items,
            tableNumber: order.table?.table_number,
            timestamp: new Date()
        });

        io.emit('order-list-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            status,
            itemId: null,
            itemStatus: null,
            tableNumber: order.table?.table_number,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Update order item status
// @route   PATCH /api/orders/:orderId/items/:itemId
// @access  Private
// Trong file orderController.js
const updateOrderItemStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderItem = await OrderItem.findByPk(req.params.itemId, {
            include: [
                {
                    model: Order,
                    as: 'order',
                    include: ['table']
                },
                {
                    model: MenuItem,
                    as: 'menuItem'
                }
            ]
        });

        if (!orderItem) {
            return res.status(404).json({
                success: false,
                message: 'Order item not found'
            });
        }

        // Update timestamps based on status
        const updates = { status };

        if (status === 'preparing' && !orderItem.started_at) {
            updates.started_at = new Date();
        } else if (status === 'ready' || status === 'served') {
            updates.completed_at = new Date();
        }

        if (status === 'preparing') {
            updates.is_new = false;
        }

        await orderItem.update(updates);

        // Lấy lại toàn bộ item của order để tính trạng thái order
        const allItems = await OrderItem.findAll({
            where: { order_id: orderItem.order_id }
        });

        const hasUnconfirmedItems = allItems.some(item =>
            item.is_new === true || item.status === 'pending'
        );

        const allReady = allItems.every(item =>
            ['ready', 'served', 'cancelled'].includes(item.status)
        );

        const allServed = allItems.every(item =>
            ['served', 'cancelled'].includes(item.status)
        );

        const allPreparingOrAbove = allItems.every(item =>
            ['preparing', 'ready', 'served', 'cancelled'].includes(item.status)
        );

        let newOrderStatus = orderItem.order.status;

        if (hasUnconfirmedItems) {
            newOrderStatus = 'pending';
        } else if (allServed) {
            newOrderStatus = 'served';
        } else if (allReady) {
            newOrderStatus = 'ready';
        } else if (allPreparingOrAbove) {
            newOrderStatus = 'confirmed';
        }

        await Order.update(
            { status: newOrderStatus },
            { where: { id: orderItem.order_id } }
        );

        const updatedOrder = await Order.findByPk(orderItem.order_id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price', 'image_url', 'preparation_time']
                        }
                    ]
                }
            ]
        });

        const io = getIO();

        // Emit cho kitchen staff
        io.to('kitchen-staff').emit(socketEvents.ORDER_ITEM_UPDATED, {
            orderId: orderItem.order_id,
            itemId: orderItem.id,
            menuItemName: orderItem.menuItem.name,
            status,
            tableNumber: orderItem.order.table?.table_number,
            timestamp: new Date()
        });

        // Emit cho reception staff
        io.to('reception-staff').emit(socketEvents.ORDER_STATUS_UPDATED, {
            orderId: orderItem.order_id,
            status: newOrderStatus,
            menuItemName: orderItem.menuItem.name,
            tableNumber: orderItem.order.table?.table_number,
            tableNumber: orderItem.order.table?.table_number,
            timestamp: new Date()
        });

        // ✅ EMIT EVENT ĐỂ CẬP NHẬT ORDER LIST
        io.emit(socketEvents.ORDER_LIST_UPDATED, {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number,
            status: newOrderStatus,
            itemId: orderItem.id,
            itemStatus: status,
            tableNumber: updatedOrder.table?.table_number,
            timestamp: new Date()
        });

        // Giữ lại event cho kitchen page
        io.to('kitchen-staff').emit(socketEvents.KITCHEN_ORDER_UPDATED, {
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.order_number,
            status: newOrderStatus,
            itemId: orderItem.id,
            itemStatus: status,
            tableNumber: updatedOrder.table?.table_number,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: updatedOrder,
            orderStatus: newOrderStatus
        });
    } catch (error) {
        console.error('Update order item status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Process payment
// @route   POST /api/orders/:id/payment
// @access  Private
const processPayment = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { payment_method, amount } = req.body;

        const order = await Order.findByPk(req.params.id, {
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'price', 'image_url', 'preparation_time']
                        }
                    ]
                }
            ],
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.payment_status === 'paid') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Order already paid'
            });
        }

        await order.update({
            payment_status: 'paid',
            payment_method,
            status: 'paid',
            updated_by: req.user.id,
            completed_at: new Date()
        }, { transaction: t });

        if (order.table_id) {
            await Table.update(
                { status: 'available' },
                {
                    where: { id: order.table_id },
                    transaction: t
                }
            );

            // --- Sửa thêm này: emit sự kiện cập nhật trạng thái bàn ---
            const io = getIO();
            io.emit('table-status-updated', {
                tableId: order.table_id,
                tableNumber: order.table?.table_number, // thêm dòng này
                status: 'available',
                timestamp: new Date()
            });
        }

        await t.commit();

        const io = getIO();

        io.to('reception-staff').emit('order-paid', {
            orderId: order.id,
            orderNumber: order.order_number,
            tableNumber: order.table?.table_number,
            payment_method,
            timestamp: new Date()
        });

        // cho kitchen tự refetch để mất đơn ngay
        io.to('kitchen-staff').emit('kitchen-order-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            status: 'paid',
            tableNumber: order.table?.table_number,
            timestamp: new Date()
        });

        io.emit('order-list-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            status: 'paid',
            tableNumber: order.table?.table_number,
            timestamp: new Date()
        });

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        await t.rollback();
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get kitchen orders
// @route   GET /api/orders/kitchen/queue
// @access  Private/Kitchen
const getKitchenOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            where: {
                status: {
                    [Op.notIn]: ['paid', 'cancelled', 'completed']
                }
            },
            order: [
                ['priority', 'DESC'],
                ['createdAt', 'ASC']
            ],
            include: [
                {
                    model: Table,
                    as: 'table',
                    attributes: ['id', 'table_number']
                },
                {
                    model: OrderItem,
                    as: 'items',
                    where: {
                        status: {
                            [Op.in]: ['pending', 'preparing', 'ready']
                        }
                    },
                    required: true,
                    include: [
                        {
                            model: MenuItem,
                            as: 'menuItem',
                            attributes: ['id', 'name', 'preparation_time', 'price', 'image_url']
                        }
                    ]
                }
            ]
        });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Get kitchen orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
const deleteOrderItem = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { orderId, itemId } = req.params;

        const order = await Order.findByPk(orderId, {
            include: [
                {
                    model: OrderItem,
                    as: 'items'
                },
                {
                    model: Table,
                    as: 'table'
                }
            ],
            transaction: t
        });

        if (!order) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const orderItem = await OrderItem.findOne({
            where: {
                id: itemId,
                order_id: orderId
            },
            transaction: t
        });

        if (!orderItem) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Order item not found'
            });
        }

        // Chỉ cho hủy món mới chưa xác nhận
        if (!orderItem.is_new || orderItem.status !== 'pending') {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Chỉ có thể hủy món mới chưa xác nhận'
            });
        }

        const itemSubtotal = parseFloat(orderItem.subtotal);

        // Xóa món
        await orderItem.destroy({ transaction: t });

        // Lấy các item còn lại
        const remainingItems = await OrderItem.findAll({
            where: { order_id: orderId },
            transaction: t
        });

        // Nếu không còn món nào thì xóa order và cập nhật bàn
        if (remainingItems.length === 0) {
            await order.destroy({ transaction: t });

            // Kiểm tra xem có order nào khác trên bàn này không
            const otherOrders = await Order.findAll({
                where: {
                    table_id: order.table_id,
                    id: { [Op.ne]: orderId },
                    payment_status: { [Op.ne]: 'paid' },
                    status: { [Op.notIn]: ['cancelled', 'completed'] }
                },
                transaction: t
            });

            // Nếu không còn order nào khác, cập nhật bàn thành available
            if (otherOrders.length === 0 && order.table_id) {
                await Table.update(
                    { status: 'available' },
                    { where: { id: order.table_id }, transaction: t }
                );

                // Emit socket event để cập nhật trạng thái bàn
                const io = getIO();
                io.emit('table-status-updated', {
                    tableId: order.table_id,
                    tableNumber: order.table?.table_number,
                    status: 'available',
                    timestamp: new Date()
                });
            }

            await t.commit();

            return res.json({
                success: true,
                message: 'Đã xóa món và đơn hàng không còn món nào nên đã xóa luôn order'
            });
        }

        const newSubtotal = Math.max(0, parseFloat(order.subtotal) - itemSubtotal);
        const newTax = Number((newSubtotal * 0.1).toFixed(2));
        const newTotal = Number((newSubtotal + newTax).toFixed(2));

        const hasUnconfirmedItems = remainingItems.some(
            item => item.is_new === true || item.status === 'pending'
        );

        let newOrderStatus = order.status;
        if (hasUnconfirmedItems) {
            newOrderStatus = 'pending';
        } else {
            newOrderStatus = 'confirmed';
        }

        await order.update({
            subtotal: newSubtotal,
            tax: newTax,
            total: newTotal,
            status: newOrderStatus,
            updated_by: req.user?.id || null
        }, { transaction: t });

        await t.commit();

        // emit socket
        const io = getIO();
        io.to('reception-staff').emit('order-updated', {
            orderId: order.id,
            orderNumber: order.order_number,
            tableNumber: order.table?.table_number,
            message: 'Một món đã bị hủy khỏi đơn hàng',
            timestamp: new Date()
        });

        io.to('kitchen-staff').emit('order-item-deleted', {
            orderId: order.id,
            itemId: parseInt(itemId),
            tableNumber: order.table?.table_number,
            message: 'Một món mới đã bị hủy',
            timestamp: new Date()
        });

        res.json({
            success: true,
            message: 'Đã hủy món thành công'
        });
    } catch (error) {
        await t.rollback();
        console.error('Delete order item error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
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
};