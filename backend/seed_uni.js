const { University } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seed() {
    try {
        const existing = await University.findOne();
        if (existing) {
            console.log('University already exists:', existing.name);
            return;
        }

        await University.create({
            name: 'VIT Vellore',
            address: 'Katpadi, Vellore, Tamil Nadu',
            radius: 5,
            isActive: true
        });
        console.log('Seeded VIT Vellore.');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
seed();
