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
const rateRoutes = require('./routes/rateRoutes');

const app = express();
const PORT = process.env.PORT || 8000;

console.log(`[DEBUG] Entorno cargado: ${process.env.NODE_ENV || 'development'}`);
console.log(`[DEBUG] OneSignal App ID en proceso: ${process.env.ONESIGNAL_APP_ID ? 'Presente' : 'AUSENTE'}`);
console.log(`[DEBUG] Puerto configurado: ${process.env.PORT || 'Default 8000'}`);

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
        res.redirect('/downloads/app.apk'); // Redirect anyway
    }
});

// Stats endpoint
app.get('/api/download-stats', (req, res) => {
    try {
        if (fs.existsSync(STATS_FILE)) {
            const stats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
            res.json(stats);
        } else {
            res.json({ apk_downloads: 0 });
        }
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
