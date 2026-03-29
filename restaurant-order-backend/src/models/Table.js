const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const QRCode = require('qrcode');

const Table = sequelize.define('Table', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    table_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: true
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        validate: {
            min: 1,
            max: 20
        }
    },
    status: {
        type: DataTypes.ENUM('available', 'occupied', 'reserved', 'cleaning'),
        defaultValue: 'available'
    },
    qr_code: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qr_code_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.ENUM('inside', 'outside', 'vip'),
        defaultValue: 'inside'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'tables',
    hooks: {
        beforeCreate: async (table) => {
            await generateQRCode(table);
        },
        beforeUpdate: async (table) => {
            if (table.changed('table_number') || !table.qr_code) {
                await generateQRCode(table);
            }
        }
    }
});

const generateQRCode = async (table) => {
    const qrData = `${process.env.BASE_URL}/menu?table=${table.id}`;
    try {
        table.qr_code = await QRCode.toDataURL(qrData);
        table.qr_code_url = qrData;
    } catch (err) {
        console.error('Error generating QR code:', err);
    }
};

module.exports = Table;