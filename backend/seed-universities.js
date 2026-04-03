const { University } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const unis = [
            {
                name: 'Cochin University (CUSAT)',
                address: 'Kalamassery, Kochi, Kerala',
                latitude: 10.0465,
                longitude: 76.3268,
                radius: 2.0
            },
            {
                name: 'IIT Madras',
                address: 'Chennai, Tamil Nadu',
                latitude: 12.9915,
                longitude: 80.2336,
                radius: 3.5
            },
            {
                name: 'Delhi University (North Campus)',
                address: 'New Delhi, Delhi',
                latitude: 28.6892,
                longitude: 77.2106,
                radius: 2.5
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
