const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WalletTransaction = sequelize.define('WalletTransaction', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    orderId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'orders',
            key: 'id'
        }
    },
    peerId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('credit', 'debit'),
        allowNull: false,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    balanceAfter: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    }
}, {
    tableName: 'wallet_transactions',
    timestamps: true,
    updatedAt: false,
});

module.exports = WalletTransaction;
