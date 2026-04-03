const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    phoneNumber: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    socialProviderId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: true, // Allow null for social logins
    },
    role: {
        type: DataTypes.ENUM('customer', 'delivery', 'super_admin', 'campus_admin', 'shop_admin'),
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    fcmToken: {
        type: DataTypes.STRING,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    loyaltyPoints: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    loyaltyLevel: {
        type: DataTypes.ENUM('Learner', 'Explorer', 'Pro', 'Legend'),
        defaultValue: 'Learner',
    },
    laroCurrency: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    vehicleType: {
        type: DataTypes.STRING, // e.g., 'bicycle', 'scooter', 'car'
        allowNull: true,
    },
    vehicleNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true,
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
    tableName: 'users',
    timestamps: true,
});

module.exports = User;
