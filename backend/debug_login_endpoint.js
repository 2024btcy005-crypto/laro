const axios = require('axios');

async function debugLogin() {
    try {
        console.log('Sending login request to http://localhost:5000/api/auth/login');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            phoneNumber: '9999988888',
            password: 'partner123'
        });
        console.log('SUCCESS:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('ERROR STATUS:', error.response.status);
            console.log('ERROR DATA:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('ERROR:', error.message);
        }
    }
}

debugLogin();
