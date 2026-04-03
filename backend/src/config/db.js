const { Sequelize } = require('sequelize');
const config = require('./database')[process.env.NODE_ENV || 'development'];

const sequelize = config.use_env_variable
    ? new Sequelize(process.env[config.use_env_variable], config)
    : new Sequelize(config.database, config.username, config.password, config);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL Database connected successfully.');
        return true;
    } catch (error) {
        console.warn('⚠️  Database connection failed. Running without DB (mock/test mode).');
        console.warn('   Reason:', error.message);
        return false;
    }
};

module.exports = { sequelize, connectDB };
