const { University } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const unis = [
            {
                name: 'Joyy University',
                address: 'Kanyakumari, Tamil Nadu',
                latitude: 8.0883,
                longitude: 77.5385,
                radius: 3.0
            }
        ];

        for (const uniData of unis) {
            const [uni, created] = await University.findOrCreate({
                where: { name: uniData.name },
                defaults: uniData
            });
            if (created) {
                console.log(`Created: ${uni.name}`);
            } else {
                console.log(`Exists: ${uni.name}`);
            }
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seed();
