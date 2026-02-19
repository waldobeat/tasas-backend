const nodemailer = require('nodemailer');
require('dotenv').config();

// Email Transporter (configurar en .env)
// Email Transporter (configurar en .env)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // True for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '') // Remove spaces from app password
    }
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
