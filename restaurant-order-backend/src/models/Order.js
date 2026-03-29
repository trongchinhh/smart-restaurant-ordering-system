const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    order_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    // Loại đơn hàng: tại bàn, mang về, giao hàng
    order_type: {
        type: DataTypes.ENUM('dine_in', 'takeaway', 'delivery'),
        defaultValue: 'dine_in'
    },
    takeaway_qr_id: {  // THÊM TRƯỜNG NÀY (giống table_id)
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'takeaway_qrs',
            key: 'id'
        }
    },
    table_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'tables',
            key: 'id'
        }
    },
    customer_name: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    customer_phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    customer_count: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    status: {
        type: DataTypes.ENUM(
            'pending',      // Chờ xác nhận
            'confirmed',    // Đã xác nhận
            'preparing',    // Đang chế biến
            'ready',        // Đã sẵn sàng
            'served',       // Đã phục vụ
            'completed',    // Hoàn thành
            'cancelled',    // Đã hủy
            'paid'          // Đã thanh toán
        ),
        defaultValue: 'pending'
    },
    payment_status: {
        type: DataTypes.ENUM('unpaid', 'paid', 'partial'),
        defaultValue: 'unpaid'
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'card', 'transfer'),
        allowNull: true
    },
    // Cho phép gọi thêm món
    is_parent_order: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Đơn hàng chính
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    tax: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    special_requests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    priority: {
        type: DataTypes.ENUM('normal', 'high', 'urgent'),
        defaultValue: 'normal'
    },
    estimated_time: {
        type: DataTypes.INTEGER,
        comment: 'Estimated preparation time in minutes',
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'orders',
    hooks: {
        beforeCreate: async (order) => {
            order.order_number = await generateOrderNumber();
        }
    }
});

const generateOrderNumber = async () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const count = await Order.count({
        where: {
            createdAt: {
                [sequelize.Sequelize.Op.gte]: new Date().setHours(0, 0, 0, 0)
            }
        }
    });
    return `ORD${year}${month}${day}${(count + 1).toString().padStart(4, '0')}`;
};

module.exports = Order;