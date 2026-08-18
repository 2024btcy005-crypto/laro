const { Client } = require('pg');
require('dotenv').config();

const regions = ['ap-south-1', 'us-east-1', 'us-west-1', 'eu-central-1', 'ap-southeast-1'];

async function testRegions() {
    for (const region of regions) {
        const host = `aws-0-${region}.pooler.supabase.com`;
        const connectionString = process.env.DATABASE_URL;
        console.log(`Testing region: ${region} (${host})...`);
        const client = new Client({
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000
        });

        try {
            await client.connect();
            console.log(`✅ SUCCESS! Connected to Supabase via ${region} pooler!`);
            const res = await client.query('SELECT NOW(), version();');
            console.log('Result:', res.rows[0]);
            await client.end();
            return { region, host, connectionString };
        } catch (err) {
            console.log(`❌ Failed on ${region}:`, err.message);
        }
    }
}

testRegions();
