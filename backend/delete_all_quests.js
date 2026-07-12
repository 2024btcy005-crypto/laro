const { Quest } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function run() {
    try {
        console.log('Deleting all quests from database...');
        const count = await Quest.destroy({ where: {} });
        console.log(`✅ Successfully deleted ${count} mock/test quests!`);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

run();
