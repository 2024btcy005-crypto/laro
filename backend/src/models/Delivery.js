const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Delivery = sequelize.define('Delivery', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    partnerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    status: {
        type: DataTypes.ENUM('assigned', 'picked', 'delivered', 'cancelled'),
        defaultValue: 'assigned',
    },
    assignedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    pickedAt: {
        type: DataTypes.DATE,
    },
    deliveredAt: {
        type: DataTypes.DATE,
    }
}, {
    tableName: 'deliveries',
    timestamps: false,
});

module.exports = Delivery;
