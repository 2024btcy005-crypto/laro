const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');
const { User, University } = require('../src/models');
const bcrypt = require('bcryptjs');

async function resetJoyCredentials() {
    try {
        await sequelize.authenticate();
        console.log('--- RESETTING JOY UNIVERSITY CREDENTIALS ---');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        const uni = await University.findOne({ where: { name: 'JOY UNIVERSITY' } });
        if (!uni) {
            console.log('JOY UNIVERSITY not found.');
            process.exit(1);
        }

        console.log(`Joy University ID: ${uni.id}`);

        // Update/Ensure Campus Admin
        let campusAdmin = await User.findOne({ where: { email: 'joy_admin@zippit.com' } });
        if (!campusAdmin) {
            campusAdmin = await User.create({
                name: 'Joy Campus Admin',
                email: 'joy_admin@zippit.com',
                phoneNumber: '9876543211',
                passwordHash: passwordHash,
                role: 'campus_admin',
                universityId: uni.id,
                isActive: true
            });
        } else {
            await campusAdmin.update({
                passwordHash: passwordHash,
                universityId: uni.id,
                isActive: true
            });
        }

        // Update/Ensure Customer (Student)
        let student = await User.findOne({ where: { phoneNumber: '9876543210' } });
        if (student) {
            await student.update({
                passwordHash: passwordHash,
                universityId: uni.id,
                isActive: true
            });
        }

        // Update/Ensure Delivery Partner (Rider)
        let rider = await User.findOne({ where: { phoneNumber: '9876500001' } });
        if (rider) {
            await rider.update({
                passwordHash: passwordHash,
                universityId: uni.id,
                isActive: true
            });
        }

        console.log('✅ Joy University credentials successfully updated to password: "password123"');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

resetJoyCredentials();
