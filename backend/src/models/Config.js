const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Config = sequelize.define('Config', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    taxRate: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0,
        comment: 'Standard tax percentage applied at checkout'
    },
    handlingCharge: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 2.00,
        comment: 'Fixed handling or platform fee per order'
    },
    defaultDeliveryFee: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
        comment: 'Standard delivery fee added to checkout'
    }
}, {
    tableName: 'configs',
    timestamps: true
});

module.exports = Config;
