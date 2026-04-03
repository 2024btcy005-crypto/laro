const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
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
    productId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    priceAtTime: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
    }
}, {
    tableName: 'order_items',
    timestamps: false,
});

module.exports = OrderItem;
