const axios = require('axios');

async function testLogin() {
    try {
        console.log('Testing login...');
        const response = await axios.post('https://tasas-backend.onrender.com/api/auth/login', {
            email: 'test@test.com',
            password: 'password123'
        });
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.log('Server Error Status:', error.response.status);
            console.log('Server Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Network/Client Error:', error.message);
        }
    }
}

testLogin();
