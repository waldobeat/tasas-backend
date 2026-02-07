const express = require('express');
const cors = require('cors');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
require('dotenv').config();

const connectDB = require('./config/db');
const { migrateHistory, setupCronJobs, checkMissedSchedule } = require('./services/cronService');
const { startMonitoring } = require('./services/monitorService');

// Routes
const authRoutes = require('./routes/authRoutes');
const financeRoutes = require('./routes/financeRoutes');
const rateRoutes = require('./routes/rateRoutes');
const pushTokenRoutes = require('./routes/pushTokenRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB().then(() => {
    // Run checks after DB connection
    migrateHistory().then(() => {
        checkMissedSchedule();
    });
});

app.use(cors());
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api', rateRoutes); // Mounts /rates and /history
app.use('/api/pushtoken', pushTokenRoutes);

app.use(express.static('public'));

// 404 Catch-all for API
app.use('/api', (req, res) => {
    console.warn(`⚠️ 404 NOT FOUND: ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Start Background Tasks
setupCronJobs();
startMonitoring();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
