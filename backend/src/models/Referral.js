const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Referral = sequelize.define('Referral', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    referrerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    refereeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    referralCode: {
        type: DataTypes.STRING(12),
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed'),
        defaultValue: 'pending',
    },
    rewardCoins: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'referrals',
    timestamps: true,
});

module.exports = Referral;
