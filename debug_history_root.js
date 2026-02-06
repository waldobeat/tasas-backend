const dns = require('dns');
dns.setServers(['1.1.1.1', '1.0.0.1']); // Cloudflare DNS (Alternative)
// dns.setServers(['1.1.1.1', '1.0.0.1']); // Cloudflare DNS (Alternative)

const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
    try {
        console.log('⏳ Attempting to connect to MongoDB...');
        console.log('URI:', process.env.MONGODB_URI.replace(/:([^:@]{1,})@/, ':****@')); // Hide password in logs

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB Successfully!');

        await mongoose.disconnect();
        console.log('👋 Disconnected');

    } catch (e) {
        console.error('❌ Error:', e);
    }
}

run();
