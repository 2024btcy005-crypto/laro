const { sequelize } = require('./src/config/db');
const { User, University } = require('./src/models');

async function checkRiders() {
    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        const riders = await User.findAll({
            where: { role: 'delivery' },
            include: [{ model: University, as: 'university' }]
        });

        console.log(`\nFound ${riders.length} delivery partners:\n`);
        riders.forEach(r => {
            console.log(`- NAME: ${r.name}`);
            console.log(`  ID: ${r.id}`);
            console.log(`  ROLE: ${r.role}`);
            console.log(`  UNI_ID: ${r.universityId || 'NONE'}`);
            console.log(`  UNI_NAME: ${r.university ? r.university.name : 'NONE'}`);
            console.log(`  VEHICLE: ${r.vehicleType || 'NONE'} (${r.vehicleNumber || 'NONE'})`);
            console.log('-------------------');
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkRiders();
