const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
console.log(`[DEBUG] Intentando cargar .env desde: ${path.join(__dirname, '.env')}`);
const result = require('dotenv').config({ path: path.join(__dirname, '.env') });
if (result.error) {
    console.error(`[DEBUG] Error cargando .env: ${result.error.message}`);
} else {
    console.log(`[DEBUG] .env cargado con éxito. Variables encontradas: ${Object.keys(result.parsed || {}).length}`);
    console.log(`[DEBUG] ONESIGNAL_APP_ID: ${process.env.ONESIGNAL_APP_ID ? 'OK' : 'MISSING'}`);
}

const { setupCronJobs } = require('./services/cronService');
// const { setupDebtScheduler } = require('./services/schedulerService');
const rateRoutes = require('./routes/rateRoutes');
// Connect to Database
const connectDB = require('./config/db');
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Start Schedulers
setupCronJobs();

// Mount Routes
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
// const financeRoutes = require('./routes/financeRoutes'); // Keep if needed, preventing errors if missing

// Mount Routes
app.get('/api/version', (req, res) => res.json({ version: '1.2', timestamp: new Date().toISOString() }));

console.log('✅ Mounting authRoutes at /api/auth');
app.use('/api/auth', authRoutes);

console.log('✅ Mounting commentRoutes at /api/comments');
app.use('/api/comments', commentRoutes);

console.log('✅ Mounting rateRoutes at /api');
app.use('/api', rateRoutes);

// app.use('/api/finance', financeRoutes); // Uncomment if finance module is active

const { broadcastNotification } = require('./utils/pushNotifications');

// Test Push Endpoint
app.post('/api/test-push', async (req, res) => {
    try {
        await broadcastNotification("🔔 Prueba de Sistema", "Si recibes esto, las notificaciones están funcionando correctamente.");
        res.json({ message: 'Notificación enviada' });
    } catch (error) {
        console.error("Error in test-push:", error);
        res.status(500).json({ error: error.message });
    }
});

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

const STATS_FILE = path.join(__dirname, 'stats.json');

// Download tracking endpoint
app.get('/api/download', (req, res) => {
    try {
        const offset = parseInt(process.env.DOWNLOAD_OFFSET || '0', 10);
        let stats = { apk_downloads: 0 };
        if (fs.existsSync(STATS_FILE)) {
            stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        }
        stats.apk_downloads = (stats.apk_downloads || 0) + 1;
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

        // Redirect to the actual APK file
        res.redirect('/downloads/app.apk');
    } catch (error) {
        console.error('Error tracking download:', error);
        res.redirect('/downloads/app.apk');
    }
});

// Stats endpoint
app.get('/api/download-stats', (req, res) => {
    try {
        const offset = parseInt(process.env.DOWNLOAD_OFFSET || '0', 10);
        let stats = { apk_downloads: 0 };
        if (fs.existsSync(STATS_FILE)) {
            stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        }

        // Return total = file count + environment offset
        res.json({
            apk_downloads: (stats.apk_downloads || 0) + offset
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching stats' });
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
