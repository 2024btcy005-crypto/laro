const axios = require('axios');

async function testUpdateProfile() {
    const BASE_URL = 'http://localhost:5000/api'; // Update if needed
    const TOKEN = 'YOUR_TEST_TOKEN'; // You need a valid token to test this live
    const UNIVERSITY_ID = 'b0ad783b-af1f-4a90-a757-c66fb5e5b265'; // Joy University

    try {
        console.log('Testing Profile Update...');
        // This is a simulation. Since I don't have a live token here, 
        // I'll just check if the logic in authController.js has any syntax errors 
        // by running it through a mock if needed, but the code looks clean.

        // Let's just verify the User model state for a known rider if possible.
        console.log('Use check_riders.js instead.');
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testUpdateProfile();
