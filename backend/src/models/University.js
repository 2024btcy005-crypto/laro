const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const University = sequelize.define('University', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    address: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
    },
    radius: {
        type: DataTypes.FLOAT,
        defaultValue: 3.0, // Default 3km campus radius
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    }
}, {
    tableName: 'universities',
    timestamps: true,
});

module.exports = University;
