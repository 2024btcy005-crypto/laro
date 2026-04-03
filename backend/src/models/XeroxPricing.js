const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const XeroxPricing = sequelize.define('XeroxPricing', {
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
    bwSingle: {
        type: DataTypes.FLOAT,
        defaultValue: 1.0, // 1 per page
    },
    bwDouble: {
        type: DataTypes.FLOAT,
        defaultValue: 1.5, // 1.5 per page for double
    },
    colorSingle: {
        type: DataTypes.FLOAT,
        defaultValue: 5.0,
    },
    colorDouble: {
        type: DataTypes.FLOAT,
        defaultValue: 8.0,
    },
    // Ratios (1:1, 1:2, etc.) can be added here if needed
}, {
    tableName: 'xerox_pricing',
    timestamps: true,
});

module.exports = XeroxPricing;
