const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Quest = sequelize.define('Quest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING(150),
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    universityId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'universities',
            key: 'id'
        }
    },
    productId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id'
        }
    },
    targetCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 300,
    },
    currentCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    rewardAmount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
    },
    status: {
        type: DataTypes.ENUM('active', 'completed'),
        defaultValue: 'active',
    }
}, {
    tableName: 'quests',
    timestamps: true,
});

module.exports = Quest;
