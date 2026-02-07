const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect("mongodb+srv://latasa:Latasa2026@latasa.dhmt7nn.mongodb.net/?appName=latasa", { family: 4 });
        console.log('✅ Connected to MongoDB Atlas');
        return conn;
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
