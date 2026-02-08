const express = require('express');
const cors = require('cors');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
require('dotenv').config();

const { setupCronJobs } = require('./services/cronService');

// Core Routes Only
const rateRoutes = require('./routes/rateRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());



// Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

const { saveToken } = require('./utils/pushNotifications');

// Mount Routes
app.use('/api', rateRoutes); // Mounts /rates and /history

// Push Notification Registration Endpoint
app.post('/api/register-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ error: 'Token is required' });
    }

    const saved = saveToken(token);
    if (saved) {
        res.status(201).json({ message: 'Token registered' });
    } else {
        res.status(200).json({ message: 'Token already exists or invalid' });
    }
});

app.use(express.static('public'));

// 404 Catch-all for API
app.use('/api', (req, res) => {
    console.warn(`⚠️ 404 NOT FOUND: ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start Background Tasks (Simplified)
setupCronJobs();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 NUCLEAR SERVER running on port ${PORT}`);
});
