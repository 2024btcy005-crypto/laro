const { User } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function run() {
    try {
        const uniId = '0f17f6b8-12e0-4878-a555-ff52857bc8d1';
        console.log(`Setting all users' universityId to ${uniId}...`);
        const [count] = await User.update({ universityId: uniId }, { where: {} });
        console.log(`✅ Successfully updated ${count} users!`);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

run();
