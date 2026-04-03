const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    shopId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'shops',
            key: 'id'
        }
    },
    totalAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('placed', 'accepted', 'picked', 'out_for_delivery', 'delivered', 'cancelled'),
        defaultValue: 'placed',
    },
    paymentMethod: {
        type: DataTypes.ENUM('cod', 'online', 'laro_coins'),
        allowNull: false,
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'failed', 'completed'),
        defaultValue: 'pending',
    },
    deliveryAddress: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    couponCode: {
        type: DataTypes.STRING(20),
        allowNull: true,
    },
    discountAmount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    deliveryOtp: {
        type: DataTypes.STRING(4),
        allowNull: true, // Will be generated on creation
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
    tableName: 'orders',
    timestamps: true,
});

module.exports = Order;
