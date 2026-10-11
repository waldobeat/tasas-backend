const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Fix for DNS issues in some environments
const dns = require('dns');
dns.setServers(['8.8.8.8']);

const clearUsers = async () => {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await mongoose.connect("mongodb+srv://latasa:Latasa2026@latasa.dhmt7nn.mongodb.net/?appName=latasa", { family: 4 });
        console.log('✅ Connected.');

        const result = await User.deleteMany({});
        console.log(`🗑️ Deleted ${result.deletedCount} users.`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

clearUsers();
