// Debug Coupons in DB
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { Coupon } = require('../src/models');

async function debug() {
    try {
        await sequelize.authenticate();
        const coupons = await Coupon.findAll();
        console.log('--- Current Coupons in DB ---');
        console.log(JSON.stringify(coupons, null, 2));
        console.log('-----------------------------');

        const now = new Date();
        console.log('Current Server Time:', now.toISOString());

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await sequelize.close();
    }
}

debug();
