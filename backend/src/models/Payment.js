const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
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
    razorpayOrderId: {
        type: DataTypes.STRING,
        unique: true,
    },
    razorpayPaymentId: {
        type: DataTypes.STRING,
        unique: true,
    },
    razorpaySignature: {
        type: DataTypes.STRING,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    status: {
        type: DataTypes.STRING(50),
        defaultValue: 'created',
    }
}, {
    tableName: 'payments',
    timestamps: true,
    updatedAt: false, // only hook created_at in schema
});

module.exports = Payment;
