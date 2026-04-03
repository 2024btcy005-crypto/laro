const { Advertisement } = require('./src/models');
const { sequelize } = require('./src/config/db');

async function seedAd() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Deactivate existing ads
        await Advertisement.update({ isActive: false }, { where: {} });

        // Create new active ad
        const ad = await Advertisement.create({
            title: 'MEGA SUMMER SALE 🚀',
            imageUrl: '/uploads/promo_banner.png',
            linkUrl: 'https://zippit.app/offers',
            isActive: true
        });

        console.log('✅ Advertisement seeded successfully:', ad.toJSON());
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedAd();
