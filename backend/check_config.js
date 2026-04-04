const { Config } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function check() {
    try {
        const configs = await Config.findAll();
        console.log('Configs found:', configs.length);
        configs.forEach(c => {
            console.log(`Key: ${c.key}, Value: ${c.value}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
check();
