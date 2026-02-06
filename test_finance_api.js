const axios = require('axios');

const API_URL = 'http://localhost:8000/api/finance';
const testUserId = '67a3dad52e79601f705e4630'; // Jasus user id from previous Turn

async function test() {
    try {
        console.log("--- Testing POST ---");
        const postRes = await axios.post(API_URL, {
            userId: testUserId,
            title: 'Test Debt',
            amount: 100,
            type: 'debt',
            category: 'Test',
            date: new Date().toISOString()
        });
        const newId = postRes.data._id;
        console.log("POST Success, New ID:", newId);

        console.log("\n--- Testing PUT (Abono) ---");
        const putRes = await axios.put(`${API_URL}/${newId}`, {
            amount: 100,
            completed: false,
            payments: [{
                id: Date.now().toString(),
                amount: 20,
                date: new Date().toISOString()
            }]
        });
        console.log("PUT Success:", putRes.data.payments.length, "payments");

        console.log("\n--- Testing DELETE ---");
        await axios.delete(`${API_URL}/${newId}`);
        console.log("DELETE Success");

    } catch (e) {
        console.error("Test Failed:", e.response ? e.response.status : e.message, e.response ? e.response.data : '');
    }
}

test();
