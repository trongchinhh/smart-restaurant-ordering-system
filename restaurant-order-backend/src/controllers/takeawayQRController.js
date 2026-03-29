const { TakeawayQR, Order, OrderItem, MenuItem, User } = require('../models');
const { sequelize } = require('../models');
const QRCode = require('qrcode');
const { getIO } = require('../config/socket');

// Hàm tạo code
const generateCode = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TQ${year}${month}${day}${random}`;
};

// @desc    Tạo QR code takeaway mới
// @route   POST /api/takeaway-qr
// @access  Private
const createTakeawayQR = async (req, res) => {
    try {
        const { name } = req.body;

        console.log('🔄 Creating takeaway QR...');

        // Tạo code trước
        const code = generateCode();

        console.log('📋 Generated code:', code);

        // Tạo QR takeaway mới với code đã tạo
        const takeawayQR = await TakeawayQR.create({
            code: code, // Gán code trực tiếp
            name: name || 'QR Mang về',
            created_by: req.user.id
        });

        console.log('✅ Takeaway QR created:', takeawayQR.toJSON());

        // Tạo QR code image
        const customerUrl = process.env.CUSTOMER_URL || 'http://localhost:3001';
        const qrData = `${customerUrl}/takeaway?qr=${takeawayQR.code}`;
        const qrCode = await QRCode.toDataURL(qrData);

        // Cập nhật QR code
        await takeawayQR.update({
            qr_code: qrCode,
            qr_code_url: qrData
        });

        // Lấy thông tin người tạo
        const creator = await User.findByPk(req.user.id, {
            attributes: ['id', 'username', 'full_name']
        });

        res.status(201).json({
            success: true,
            data: {
                id: takeawayQR.id,
                code: takeawayQR.code,
                name: takeawayQR.name,
                qr_code: qrCode,
                qr_code_url: qrData,
                is_active: takeawayQR.is_active,
                created_by: creator,
                created_at: takeawayQR.createdAt
            }
        });
    } catch (error) {
        console.error('❌ Create takeaway QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Lấy danh sách QR takeaway
// @route   GET /api/takeaway-qr
// @access  Private
const getTakeawayQRs = async (req, res) => {
    try {
        const takeawayQRs = await TakeawayQR.findAll({
            include: [
                {
                    model: Order,
                    as: 'orders',
                    required: false,
                    limit: 5,
                    order: [['createdAt', 'DESC']],
                    include: [
                        {
                            model: OrderItem,
                            as: 'items',
                            include: ['menuItem']
                        }
                    ]
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            data: takeawayQRs
        });
    } catch (error) {
        console.error('Get takeaway QRs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Lấy thông tin QR takeaway bằng code (public)
// @route   GET /api/takeaway-qr/public/:code
// @access  Public
const getTakeawayQRByCode = async (req, res) => {
    try {
        const { code } = req.params;

        const takeawayQR = await TakeawayQR.findOne({
            where: {
                code,
                is_active: true
            }
        });

        if (!takeawayQR) {
            return res.status(404).json({
                success: false,
                message: 'Mã QR không hợp lệ'
            });
        }

        res.json({
            success: true,
            data: {
                id: takeawayQR.id,
                code: takeawayQR.code,
                name: takeawayQR.name
            }
        });
    } catch (error) {
        console.error('Get takeaway QR by code error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Tạo đơn hàng takeaway (public)
// @route   POST /api/takeaway-qr/public/:code/order
// @access  Public
const createTakeawayOrder = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { code } = req.params;
        const { customer_name, customer_phone, items, note } = req.body;

        // Kiểm tra QR code
        const takeawayQR = await TakeawayQR.findOne({
            where: {
                code,
                is_active: true
            },
            transaction: t
        });

        if (!takeawayQR) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: 'Mã QR không hợp lệ'
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn món ăn'
            });
        }

        // Tính tổng tiền
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
                    message: 'Món ăn không tồn tại'
                });
            }

            if (menuItem.status !== 'available') {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: `${menuItem.name} hiện không khả dụng`
                });
            }

            const quantity = item.quantity || 1;
            const price = menuItem.discount_price || menuItem.price;
            const itemSubtotal = price * quantity;

            subtotal += itemSubtotal;
            totalPreparationTime = Math.max(totalPreparationTime, menuItem.preparation_time);

            orderItems.push({
                menu_item_id: menuItem.id,
                menuItemName: menuItem.name,
                quantity,
                unit_price: price,
                subtotal: itemSubtotal,
                note: item.note || ''
            });
        }
        const generateOrderNumber = () => {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.floor(1000 + Math.random() * 9000);
            return `ORD-${date}-${random}`;
        };
        // Tạo đơn hàng takeaway
        const order = await Order.create({
            order_number: generateOrderNumber(),
            order_type: 'takeaway',
            takeaway_qr_id: takeawayQR.id,
            customer_name: customer_name || 'Khách',
            customer_phone: customer_phone || '',
            subtotal,
            tax: Number((subtotal * 0.1).toFixed(2)),
            total: Number((subtotal * 1.1).toFixed(2)),
            note: note || '',
            estimated_time: totalPreparationTime,
            status: 'pending',
            payment_status: 'unpaid'
        }, { transaction: t });

        // Tạo order items
        for (const item of orderItems) {
            await OrderItem.create({
                order_id: order.id,
                menu_item_id: item.menu_item_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                subtotal: item.subtotal,
                note: item.note,
                status: 'pending'
            }, { transaction: t });
        }

        await t.commit();

        // Lấy thông tin đơn hàng hoàn chỉnh
        const completeOrder = await Order.findByPk(order.id, {
            include: [
                {
                    model: TakeawayQR,
                    as: 'takeawayQR',
                    attributes: ['id', 'code', 'name']
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

        io.to('reception-staff').emit('new-takeaway-order', {
            message: 'Có đơn takeaway mới!',
            order: completeOrder,
            takeawayCode: takeawayQR.code,
            timestamp: new Date()
        });

        io.to('kitchen-staff').emit('kitchen-new-order', {
            message: 'Món takeaway mới cần chế biến!',
            orderId: order.id,
            orderNumber: order.order_number,
            orderType: 'takeaway',
            items: orderItems.map(item => ({
                name: item.menuItemName,
                quantity: item.quantity,
                note: item.note
            })),
            estimatedTime: totalPreparationTime,
            timestamp: new Date()
        });

        res.status(201).json({
            success: true,
            data: completeOrder,
            message: 'Đặt món takeaway thành công!'
        });

    } catch (error) {
        await t.rollback();
        console.error('Create takeaway order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Vô hiệu hóa QR takeaway
// @route   PATCH /api/takeaway-qr/:id/toggle
// @access  Private
const toggleTakeawayQR = async (req, res) => {
    try {
        const takeawayQR = await TakeawayQR.findByPk(req.params.id);

        if (!takeawayQR) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy QR'
            });
        }

        await takeawayQR.update({
            is_active: !takeawayQR.is_active
        });

        res.json({
            success: true,
            data: takeawayQR
        });
    } catch (error) {
        console.error('Toggle takeaway QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    createTakeawayQR,
    getTakeawayQRs,
    getTakeawayQRByCode,
    createTakeawayOrder,
    toggleTakeawayQR
};