const { sequelize } = require('../config/database');
const Table = require('./Table');
const Category = require('./Category');
const MenuItem = require('./MenuItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const User = require('./User');
const TakeawayQR = require('./TakeawayQR'); // THÊM

// User associations
User.hasMany(Order, { foreignKey: 'created_by', as: 'createdOrders' });
User.hasMany(Order, { foreignKey: 'updated_by', as: 'updatedOrders' });
User.hasMany(TakeawayQR, { foreignKey: 'created_by', as: 'takeawayQrs' }); // THÊM
// Table associations
Table.hasMany(Order, { foreignKey: 'table_id', as: 'orders' });
Table.belongsToMany(Order, { through: 'table_orders', as: 'currentOrders' });

// Category associations
Category.hasMany(MenuItem, { foreignKey: 'category_id', as: 'menuItems' });
Category.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// MenuItem associations
MenuItem.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
MenuItem.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
MenuItem.hasMany(OrderItem, { foreignKey: 'menu_item_id', as: 'orderItems' });

// TakeawayQR associations - SỬA LẠI CHO ĐÚNG
TakeawayQR.hasMany(Order, {
    foreignKey: 'takeaway_qr_id',
    as: 'orders'
});

TakeawayQR.belongsTo(User, {
    foreignKey: 'created_by',
    as: 'creator'
});

// Order associations
Order.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });
Order.belongsTo(TakeawayQR, { foreignKey: 'takeaway_qr_id', as: 'takeawayQR' }); // THÊM
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });

// OrderItem associations
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderItem.belongsTo(MenuItem, { foreignKey: 'menu_item_id', as: 'menuItem' });

module.exports = {
    sequelize,
    Table,
    Category,
    MenuItem,
    Order,
    OrderItem,
    User,
    TakeawayQR // THÊM
};