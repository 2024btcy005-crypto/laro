const { sequelize } = require('../src/config/db');
const Shop = require('../src/models/Shop');

async function updateBranding() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const [updatedRows] = await Shop.update(
            { name: 'Laro Warehouse' },
            { where: { name: 'Zippit Warehouse' } }
        );

        console.log(`Successfully updated ${updatedRows} shop(s) to 'Laro Warehouse'.`);
    } catch (error) {
        console.error('Update failed:', error);
    } finally {
        await sequelize.close();
    }
}

updateBranding();
