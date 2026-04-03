// Seed a test coupon
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Coupon } = require('../src/models');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Sync models to ensure table exists
        await sequelize.sync();
        console.log('Database synced.');

        // WELCOME20: 20% off
        await Coupon.findOrCreate({
            where: { code: 'WELCOME20' },
            defaults: {
                discountType: 'percentage',
                discountValue: 20,
                minOrderAmount: 100,
                maxDiscountAmount: 50,
                expiryDate: new Date('2026-12-31'),
                usageLimit: 100
            }
        });

        // SAVE10: Fixed 10 off
        await Coupon.findOrCreate({
            where: { code: 'SAVE10' },
            defaults: {
                discountType: 'fixed',
                discountValue: 10,
                minOrderAmount: 50,
                expiryDate: new Date('2026-12-31'),
                usageLimit: 1000
            }
        });

        console.log('Test coupons seeded successfully!');
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await sequelize.close();
    }
}

seed();
