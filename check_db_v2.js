const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
const mongoose = require('mongoose');
require('dotenv').config();

async function checkConnection() {
    console.log('🧪 Testing MongoDB Connection...');
    const uri = "mongodb+srv://latasa:W8caRBLJxecdw3pl@latasa.dhmt7nn.mongodb.net/?appName=latasa";
    console.log(`URI: ${uri.replace(/:([^:@]{1,})@/, ':****@')}`);

    try {
        // Enforcing IPv4 to avoid dual-stack timeouts
        await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 5000 });
        console.log('✅ SUCCESS: Connected to MongoDB!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ FAILURE:', err.message);
        if (err.reason) console.error('Reason:', err.reason);
        process.exit(1);
    }
}

checkConnection();
