const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    options: {
        type: DataTypes.JSON,
        allowNull: true
    },
    menu_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'menu_items',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
            min: 1
        }
    },
    unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'preparing', 'ready', 'served', 'cancelled'),
        defaultValue: 'pending'
    },
    order_type: {
        type: DataTypes.ENUM('dine_in', 'takeaway'),
        defaultValue: 'dine_in'
    },
    note: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    special_requests: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    preparation_time: {
        type: DataTypes.INTEGER,
        comment: 'Individual item preparation time',
        allowNull: true
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'order_items',
    indexes: [
        {
            fields: ['order_id']
        },
        {
            fields: ['menu_item_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = OrderItem;