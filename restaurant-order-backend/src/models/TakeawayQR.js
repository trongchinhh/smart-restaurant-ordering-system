const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TakeawayQR = sequelize.define('TakeawayQR', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: true, // QUAN TRỌNG: Cho phép null
        unique: true
    },
    name: {
        type: DataTypes.STRING(100),
        defaultValue: 'QR Mang về'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    qr_code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qr_code_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    }
}, {
    tableName: 'takeaway_qrs'
    // KHÔNG CÓ HOOK
});

module.exports = TakeawayQR;