const { Order, OrderItem, MenuItem, Table, Category } = require('../models');
const { sequelize } = require('../models');
const moment = require('moment-timezone');
const { Op } = require('sequelize');
//const moment = require('moment');
const tz = 'Asia/Ho_Chi_Minh';

const calculateTrend = (current, previous) => {
    const currentValue = Number(current) || 0;
    const previousValue = Number(previous) || 0;

    if (previousValue === 0) {
        if (currentValue === 0) return 0;
        return 100;
    }

    return Number((((currentValue - previousValue) / previousValue) * 100).toFixed(1));
};
// @desc    Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const tz = 'Asia/Ho_Chi_Minh';

        const todayStart = moment.tz(tz).startOf('day');
        const todayEnd = moment.tz(tz).endOf('day');

        const yesterdayStart = todayStart.clone().subtract(1, 'day').startOf('day');
        const yesterdayEnd = todayStart.clone().subtract(1, 'day').endOf('day');

        // Nếu DB lưu UTC thì đổi sang UTC trước khi query
        const todayStartUtc = todayStart.clone().utc().toDate();
        const todayEndUtc = todayEnd.clone().utc().toDate();
        const yesterdayStartUtc = yesterdayStart.clone().utc().toDate();
        const yesterdayEndUtc = yesterdayEnd.clone().utc().toDate();

        const [todayOrders, yesterdayOrders, activeOrders, tables, popularItems] = await Promise.all([
            Order.findAll({
                where: {
                    created_at: {
                        [Op.between]: [todayStartUtc, todayEndUtc]
                    }
                }
            }),

            Order.findAll({
                where: {
                    created_at: {
                        [Op.between]: [yesterdayStartUtc, yesterdayEndUtc]
                    }
                }
            }),

            Order.count({
                where: {
                    status: { [Op.in]: ['pending', 'confirmed', 'preparing'] }
                }
            }),

            Table.findAll(),

            OrderItem.findAll({
                attributes: [
                    'menu_item_id',
                    [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
                    [sequelize.fn('COUNT', sequelize.col('order_id')), 'order_count'],
                    [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_revenue']
                ],
                where: {
                    created_at: {
                        [Op.gte]: moment.tz(tz).subtract(7, 'days').utc().toDate()
                    }
                },
                include: [{
                    model: MenuItem,
                    as: 'menuItem',
                    attributes: ['id', 'name', 'price', 'image_url', 'category_id'],
                    include: [{
                        model: Category,
                        as: 'category',
                        attributes: ['id', 'name']
                    }]
                }],
                group: ['menu_item_id', 'menuItem.id', 'menuItem->category.id'],
                order: [[sequelize.literal('total_quantity'), 'DESC']],
                limit: 5
            })
        ]);

        const todayRevenue = todayOrders
            .filter(order => order.payment_status === 'paid')
            .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

        const yesterdayRevenue = yesterdayOrders
            .filter(order => order.payment_status === 'paid')
            .reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);

        const todayOrderCount = todayOrders.length;
        const yesterdayOrderCount = yesterdayOrders.length;

        const availableTables = tables.filter(t => t.status === 'available').length;
        const occupiedTables = tables.filter(t => t.status === 'occupied').length;

        const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue);
        const ordersTrend = calculateTrend(todayOrderCount, yesterdayOrderCount);

        res.json({
            success: true,
            data: {
                today: {
                    orders: todayOrderCount,
                    revenue: todayRevenue
                },
                yesterday: {
                    orders: yesterdayOrderCount,
                    revenue: yesterdayRevenue
                },
                trends: {
                    revenue: revenueTrend,
                    orders: ordersTrend
                },
                activeOrders: activeOrders || 0,
                tables: {
                    total: tables.length,
                    available: availableTables,
                    occupied: occupiedTables,
                    availablePercentage: tables.length
                        ? Number(((availableTables / tables.length) * 100).toFixed(1))
                        : 0
                },
                popularItems: popularItems
                    .filter(item => item.menuItem)
                    .map(item => ({
                        id: item.menuItem.id,
                        name: item.menuItem.name,
                        price: parseFloat(item.menuItem.price) || 0,
                        image_url: item.menuItem.image_url,
                        category: item.menuItem.category
                            ? {
                                id: item.menuItem.category.id,
                                name: item.menuItem.category.name
                            }
                            : null,
                        total_quantity: parseInt(item.dataValues.total_quantity) || 0,
                        order_count: parseInt(item.dataValues.order_count) || 0,
                        total_revenue: parseFloat(item.dataValues.total_revenue) || 0
                    }))
            }
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get revenue statistics
const getRevenueStats = async (req, res) => {
    try {
        const { period = 'day', start_date, end_date } = req.query;

        let start, end, groupFormat;

        if (start_date && end_date) {
            start = moment(start_date).startOf('day');
            end = moment(end_date).endOf('day');
            groupFormat = '%Y-%m-%d';
        } else {
            switch (period) {
                case 'week':
                    start = moment().startOf('week');
                    end = moment().endOf('week');
                    groupFormat = '%Y-%m-%d';
                    break;
                case 'month':
                    start = moment().startOf('month');
                    end = moment().endOf('month');
                    groupFormat = '%Y-%m-%d';
                    break;
                case 'year':
                    start = moment().startOf('year');
                    end = moment().endOf('year');
                    groupFormat = '%Y-%m';
                    break;
                default: // day
                    start = moment().startOf('day');
                    end = moment().endOf('day');
                    groupFormat = '%H:00';
            }
        }




        // SỬA QUAN TRỌNG: Dùng created_at thay vì createdAt
        const revenueData = await Order.findAll({
            attributes: [
                [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), groupFormat), 'period'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'order_count'],
                [sequelize.fn('SUM', sequelize.col('total')), 'revenue'],
                [sequelize.fn('AVG', sequelize.col('total')), 'avg_order_value']
            ],
            where: {
                payment_status: 'paid',
                created_at: {
                    [Op.between]: [start.toDate(), end.toDate()]
                }
            },
            group: ['period'],
            order: [[sequelize.literal('period'), 'ASC']]
        });

        // Payment methods breakdown - cũng sửa created_at
        const paymentMethods = await Order.findAll({
            attributes: [
                'payment_method',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
                [sequelize.fn('SUM', sequelize.col('total')), 'total']
            ],
            where: {
                payment_status: 'paid',
                created_at: {
                    [Op.between]: [start.toDate(), end.toDate()]
                },
                payment_method: { [Op.ne]: null }
            },
            group: ['payment_method']
        });

        res.json({
            success: true,
            data: {
                period,
                revenue: revenueData,
                paymentMethods,
                summary: {
                    totalRevenue: revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.revenue || 0), 0),
                    totalOrders: revenueData.reduce((sum, item) => sum + parseInt(item.dataValues.order_count), 0),
                    avgOrderValue: revenueData.length ?
                        revenueData.reduce((sum, item) => sum + parseFloat(item.dataValues.avg_order_value || 0), 0) / revenueData.length : 0
                }
            }
        });
    } catch (error) {
        console.error('Get revenue stats error:', {
            message: error.message,
            sql: error.sql,
            parameters: error.parameters
        });
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get product performance
const getProductStats = async (req, res) => {
    try {
        const { start_date, end_date, limit = 10 } = req.query;

        const start = start_date ? moment(start_date).startOf('day') : moment().subtract(30, 'days').startOf('day');
        const end = end_date ? moment(end_date).endOf('day') : moment().endOf('day');

        // Sửa created_at
        const bestSelling = await OrderItem.findAll({
            attributes: [
                'menu_item_id',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
                [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_revenue'],
                [sequelize.fn('COUNT', sequelize.col('order_id')), 'order_count']
            ],
            where: {
                created_at: {
                    [Op.between]: [start.toDate(), end.toDate()]
                }
            },
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: ['id', 'name', 'price', 'image_url', 'category_id'],
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name']
                }]
            }],
            group: ['menu_item_id', 'menuItem.id'],
            order: [[sequelize.literal('total_quantity'), 'DESC']],
            limit: parseInt(limit)
        });

        // Sửa created_at
        const categoryStats = await OrderItem.findAll({
            attributes: [
                [sequelize.col('menuItem.category_id'), 'category_id'],
                [sequelize.col('menuItem.category.name'), 'category_name'],
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
                [sequelize.fn('SUM', sequelize.col('subtotal')), 'total_revenue']
            ],
            where: {
                created_at: {
                    [Op.between]: [start.toDate(), end.toDate()]
                }
            },
            include: [{
                model: MenuItem,
                as: 'menuItem',
                attributes: [],
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: []
                }]
            }],
            group: ['menuItem.category_id'],
            order: [[sequelize.literal('total_revenue'), 'DESC']]
        });

        res.json({
            success: true,
            data: {
                period: {
                    start: start.toDate(),
                    end: end.toDate()
                },
                bestSelling: bestSelling
                    .filter(item => item.menuItem)
                    .map(item => ({
                        ...item.menuItem.toJSON(),
                        total_quantity: item.dataValues.total_quantity,
                        total_revenue: item.dataValues.total_revenue,
                        order_count: item.dataValues.order_count
                    })),
                categoryStats
            }
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// @desc    Get order statistics
const getOrderStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const tz = 'Asia/Ho_Chi_Minh';

        // Người dùng chọn ngày theo giờ Việt Nam
        const start = start_date
            ? moment.tz(start_date, tz).startOf('day')
            : moment.tz(tz).subtract(30, 'days').startOf('day');

        const end = end_date
            ? moment.tz(end_date, tz).endOf('day')
            : moment.tz(tz).endOf('day');

        // Đổi sang UTC để so sánh với DB nếu DB đang lưu UTC
        const startUtc = start.clone().utc().toDate();
        const endUtc = end.clone().utc().toDate();

        const ordersByStatus = await Order.findAll({
            attributes: [
                'status',
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: {
                    [Op.between]: [startUtc, endUtc]
                }
            },
            group: ['status']
        });

        const hourExpression = sequelize.fn(
            'HOUR',
            sequelize.fn('CONVERT_TZ', sequelize.col('created_at'), '+00:00', '+07:00')
        );

        const ordersByHour = await Order.findAll({
            attributes: [
                [hourExpression, 'hour'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: {
                created_at: {
                    [Op.between]: [startUtc, endUtc]
                }
            },
            group: [hourExpression],
            order: [[hourExpression, 'ASC']]
        });

        const avgPrepTime = await OrderItem.findOne({
            attributes: [
                [
                    sequelize.fn(
                        'AVG',
                        sequelize.literal('TIMESTAMPDIFF(MINUTE, started_at, completed_at)')
                    ),
                    'avg_minutes'
                ]
            ],
            where: {
                started_at: { [Op.ne]: null },
                completed_at: { [Op.ne]: null },
                created_at: {
                    [Op.between]: [startUtc, endUtc]
                }
            }
        });

        res.json({
            success: true,
            data: {
                ordersByStatus,
                ordersByHour,
                averagePreparationTime: Math.round(avgPrepTime?.dataValues?.avg_minutes || 0)
            }
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

module.exports = {
    getDashboardStats,
    getRevenueStats,
    getProductStats,
    getOrderStats
};