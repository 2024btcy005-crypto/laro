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
            name: 'JOY UNIVERSITY',
            address: 'Kanyakumari, Tamil Nadu',
            radius: 5,
            isActive: true
        });
        console.log('Seeded JOY UNIVERSITY.');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
seed();
