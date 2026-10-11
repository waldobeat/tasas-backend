const nodemailer = require('nodemailer');
require('dotenv').config();

// Email Transporter (configurar en .env)
// Email Transporter (configurar en .env)
// Email Transporter (configurar en .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    family: 4, // Force IPv4
    auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '')
    },
    logger: true,
    debug: true,
    connectionTimeout: 20000, // 20 seconds
    socketTimeout: 20000
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Transporter Error:', error);
    } else {
        console.log('✅ Server is ready to take our messages');
    }
});

module.exports = transporter;
