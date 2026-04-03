const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// For testing purposes, we might need a token if the server is running with protection
// Assuming we can test locally or the server has some test mode
async function testAnalytics() {
    console.log('--- Testing Analytics Endpoints ---');

    try {
        // Note: These routes are protected by admin middleware.
        // In a real verification, I would need a valid admin JWT.
        // For this automated check, I'll try to reach them and see if I get 401/403 (unauthorized) vs 404 (not found).
        // If I get 401, it means the route exists but is protected.

        const endpoints = [
            '/admin/stats',
            '/admin/top-products',
            '/admin/item-sales'
        ];

        for (const endpoint of endpoints) {
            try {
                const url = `${BASE_URL}${endpoint}`;
                console.log(`Checking ${url}...`);
                const res = await axios.get(url);
                console.log(`SUCCESS [${endpoint}]:`, res.status);
            } catch (err) {
                if (err.response) {
                    console.log(`RESPONSE [${endpoint}]:`, err.response.status, err.response.data);
                    if (err.response.status === 401 || err.response.status === 403) {
                        console.log(`  -> Route exists but is protected (status: ${err.response.status})`);
                    }
                } else {
                    console.log(`ERROR [${endpoint}]:`, err.message);
                }
            }
        }
    } catch (error) {
        console.error('Test script failed:', error);
    }
}

testAnalytics();
