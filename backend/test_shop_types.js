const { Shop } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function testTypes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const restaurants = await Shop.findAll({ where: { shopType: 'RESTAURANT' } });
        console.log(`\nFound ${restaurants.length} RESTAURANT shops (Will appear in FOOD TAB):`);
        restaurants.forEach(s => console.log(`- ${s.name} (${s.category})`));

        const groceries = await Shop.findAll({ where: { shopType: 'GROCERY' } });
        console.log(`\nFound ${groceries.length} GROCERY shops (Will appear in HOME PAGE):`);
        groceries.forEach(s => console.log(`- ${s.name} (${s.category})`));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

testTypes();
