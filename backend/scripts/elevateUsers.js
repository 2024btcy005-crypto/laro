// Elevate users to admin
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { User } = require('../src/models');

async function elevate() {
    try {
        await sequelize.authenticate();

        // Elevate Devikumar
        await User.update({ role: 'admin' }, { where: { name: 'Devikumar' } });

        // Elevate by specific email if known, but I'll use IDs from previous list
        await User.update({ role: 'admin' }, { where: { id: '483a2e94-6284-47d9-a0ee-fcf1f6685d08' } }); // Devikumar
        await User.update({ role: 'admin' }, { where: { id: '9648d1eb-0d1b-4e86-8e7f-e8869ca69bda' } }); // Mahalakshmi

        console.log('✅ Users elevated to admin successfully.');
    } catch (err) {
        console.error('Elevation failed:', err);
    } finally {
        await sequelize.close();
    }
}

elevate();
