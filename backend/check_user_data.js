const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function checkUser() {
    try {
        const user = await User.findOne({ where: { email: 'anegondhikumar2@gmail.com' } });
        if (user) {
            console.log('User found:');
            console.log(JSON.stringify(user.toJSON(), null, 2));
        } else {
            console.log('User not found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUser();
