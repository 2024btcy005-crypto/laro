const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:5001/api/delivery/stats');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        console.log('Error Status:', err.response?.status);
        console.log('Error Data:', err.response?.data);
        console.log('Error Message:', err.message);
    }
}

test();
