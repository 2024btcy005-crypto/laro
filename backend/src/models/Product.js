const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'shops',
            key: 'id'
        }
    },
    universityId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'universities',
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    originalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'If set, represents the original MRP. price becomes the discounted sale price.'
    },
    isAvailable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    imageUrl: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
        defaultValue: 'General',
    },
    categoryId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'categories',
            key: 'id'
        }
    },
    isVeg: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    variantOf: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        },
        comment: 'ID of the parent product if this is a variant'
    },
    variantName: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. 100g, Large, 10 Rupees Pack'
    },
    stockQuantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Current inventory level'
    },
    lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: 'Alert admin when stock falls below this'
    },
    sku: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Internal inventory tracking code'
    },
    unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'pc',
        comment: 'Measurement unit: kg, gm, pc, etc.'
    }
}, {
    tableName: 'products',
    timestamps: true,
});

module.exports = Product;
