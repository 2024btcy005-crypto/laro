const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function checkUsers() {
    try {
        const users = await User.findAll({
            attributes: ['name', 'phoneNumber', 'role'],
            limit: 20
        });
        console.log('--- USER ROLES IN DB ---');
        users.forEach(u => {
            console.log(`Name: ${u.name} | Phone: ${u.phoneNumber} | Role: ${u.role}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
