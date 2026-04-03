const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Coupon = sequelize.define('Coupon', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
    },
    discountType: {
        type: DataTypes.ENUM('percentage', 'fixed'),
        allowNull: false,
    },
    discountValue: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    minOrderAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    maxDiscountAmount: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    expiryDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    usageLimit: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means unlimited
    },
    usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    }
});

module.exports = Coupon;
