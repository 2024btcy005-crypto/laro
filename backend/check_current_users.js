const { User, University } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function run() {
    try {
        const users = await User.findAll({
            include: [{ model: University, as: 'university', attributes: ['name'] }]
        });
        console.log('--- USERS IN DATABASE ---');
        users.forEach(u => {
            console.log(`- ID: ${u.id}`);
            console.log(`  Name: ${u.name}`);
            console.log(`  Email: ${u.email}`);
            console.log(`  Role: ${u.role}`);
            console.log(`  University: ${u.university?.name || 'None'} (ID: ${u.universityId || 'None'})`);
            console.log('------------------------');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

run();
