const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sequelize } = require('../src/config/db');

async function getJoyUniversityCredentials() {
    try {
        await sequelize.authenticate();
        console.log('--- JOY UNIVERSITY DETAILS & USERS ---');

        const [universities] = await sequelize.query('SELECT * FROM "universities";');
        console.log('\nUNIVERSITIES IN DB:');
        console.dir(universities, { depth: null });

        const [users] = await sequelize.query('SELECT * FROM "users";');
        console.log('\nALL USERS IN DB:');
        console.dir(users, { depth: null });

        const [shops] = await sequelize.query('SELECT id, name, category, "universityId" FROM "shops";');
        console.log('\nSHOPS FOR JOY UNIVERSITY:');
        console.dir(shops, { depth: null });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

getJoyUniversityCredentials();
