const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    size_prices: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('size_prices');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('size_prices', JSON.stringify(value));
        }
    },
    options: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const raw = this.getDataValue('options');
            return raw ? JSON.parse(raw) : null;
        },
        set(value) {
            this.setDataValue('options', JSON.stringify(value));
        }
    },
    name_en: {
        type: DataTypes.STRING(200),
        allowNull: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0
        }
    },
    discount_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        validate: {
            min: 0
        }
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    ingredients: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('ingredients');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('ingredients', JSON.stringify(value));
        }
    },
    allergens: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('allergens');
            return rawValue ? JSON.parse(rawValue) : [];
        },
        set(value) {
            this.setDataValue('allergens', JSON.stringify(value));
        }
    },
    preparation_time: {
        type: DataTypes.INTEGER,
        defaultValue: 15,
        comment: 'Preparation time in minutes'
    },
    status: {
        type: DataTypes.ENUM('available', 'unavailable', 'sold_out'),
        defaultValue: 'available'
    },
    is_recommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'categories',
            key: 'id'
        }
    }
}, {
    tableName: 'menu_items',
    indexes: [
        {
            fields: ['category_id']
        },
        {
            fields: ['status']
        }
    ]
});

module.exports = MenuItem;