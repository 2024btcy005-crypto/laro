const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Shop = sequelize.define('Shop', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
    },
    category: {
        type: DataTypes.STRING(50),
    },
    imageUrl: {
        type: DataTypes.STRING,
    },
    isOpen: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
    },
    ratingCount: {
        type: DataTypes.STRING(20),
        defaultValue: '0',
    },
    deliveryTime: {
        type: DataTypes.STRING(20),
        defaultValue: '10 min',
    },
    costForTwo: {
        type: DataTypes.STRING(50),
        defaultValue: '₹200 for two',
    },
    promoted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true,
    },
    discount: {
        type: DataTypes.STRING(100),
        allowNull: true,
    },
    openingTime: {
        type: DataTypes.TIME,
    },
    closingTime: {
        type: DataTypes.TIME,
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    serviceRadius: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0, // Default 5km radius
    },
    isWarehouse: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    minOrderValue: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
    },
    deliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.0,
    },
    estimatedDeliveryTime: {
        type: DataTypes.STRING(50),
        defaultValue: '20-30 min',
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Manual emergency close toggle',
    },
    universityId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'universities',
            key: 'id'
        }
    },
}, {
    tableName: 'shops',
    timestamps: true,
});

module.exports = Shop;
