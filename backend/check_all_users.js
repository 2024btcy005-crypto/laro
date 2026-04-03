const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function checkAllUsers() {
    try {
        const users = await User.findAll({
            attributes: ['email', 'phoneNumber', 'name'],
            limit: 10
        });
        console.log('Sample Users:');
        console.table(users.map(u => u.toJSON()));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkAllUsers();
