const { sequelize } = require('./src/config/db');
const { University } = require('./src/models');

async function checkUniversities() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        const unis = await University.findAll();
        console.log(`\nFound ${unis.length} universities:\n`);
        unis.forEach(u => {
            console.log(`- NAME: ${u.name}`);
            console.log(`  ID: ${u.id}`);
            console.log('-------------------');
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkUniversities();
