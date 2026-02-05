const express = require('express');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');
const fs = require('fs');
const { getBCVRate } = require('./services/bcv');

const app = express();
const PORT = 8000;

// Push Notifications Setup
const expo = new Expo();
const TOKENS_FILE = 'push_tokens.json';

app.use(cors());
app.use(express.json()); // Necesario para parsear body JSON
app.use(express.static('public'));

// Load Tokens
let pushTokens = [];
if (fs.existsSync(TOKENS_FILE)) {
    try {
        pushTokens = JSON.parse(fs.readFileSync(TOKENS_FILE));
    } catch (e) {
        console.error("Error loading tokens", e);
    }
}

const saveTokens = () => {
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(pushTokens));
};

// Monitor Rates Logic
let lastKnownRates = {
    usd: { rate: null, date: null },
    eur: { rate: null, date: null }
};

const notifyUsers = async (currency, newRate, newDate = null) => {
    console.log(`📢 Enviando Notificación [${currency}]: Tasa ${newRate} a ${pushTokens.length} usuarios`);

    const title = `🏛️ Cambio Tasa Oficial (${currency})`;
    const body = `Nueva tasa oficial ${currency}: ${newRate} Bs. Fecha valor: ${newDate}`;

    let messages = [];
    for (let token of pushTokens) {
        if (!Expo.isExpoPushToken(token)) continue;
        messages.push({
            to: token,
            sound: 'default',
            title: title,
            body: body,
            data: { currency, rate: newRate, date: newDate },
        });
    }

    if (messages.length === 0) return;

    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
        try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(`✅ Chunk enviado con éxito. Tickets: ${ticketChunk.ticketChunk ? ticketChunk.ticketChunk.length : ticketChunk.length}`);
        } catch (error) {
            console.error("Error enviando push chunk", error);
        }
    }
};

// Check for updates periodically (Every 2 mins for better responsiveness)
// Check for updates periodically (Runs every minute, but logic executes hourly 9am-7pm)
setInterval(async () => {
    // Convert to Venezuela Time (UTC-4)
    const vetNow = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
    const hours = vetNow.getHours();
    const minutes = vetNow.getMinutes();

    // Check if within operating hours (9 AM - 7 PM VET)
    if (hours < 9 || hours >= 19) {
        // console.log(`💤 [${now.toLocaleTimeString()}] Fuera de horario operativo (9am - 7pm).`);
        return;
    }

    // Check if it's the top of the hour (minute 0)
    if (minutes !== 0) {
        return;
    }

    console.log(`🔍 [${vetNow.toLocaleTimeString()}] Ejecutando monitoreo programado (VET)...`);

    try {
        const bcvData = await getBCVRate().catch(e => { console.error("BCV Error:", e.message); return null; });

        // 1. Check USD
        if (bcvData && bcvData.usd) {
            const currentUsdRate = bcvData.usd.rate;
            const currentUsdDate = bcvData.value_date || '';

            if (lastKnownRates.usd.rate === null) {
                lastKnownRates.usd = { rate: currentUsdRate, date: currentUsdDate };
                console.log(`ℹ️ Tasa USD inicializada: ${currentUsdRate}`);
            } else if (currentUsdRate !== lastKnownRates.usd.rate || currentUsdDate !== lastKnownRates.usd.date) {
                console.log(`🔔 Cambio detectado en USD: ${lastKnownRates.usd.rate} -> ${currentUsdRate}`);
                lastKnownRates.usd = { rate: currentUsdRate, date: currentUsdDate };
                notifyUsers('USD', currentUsdRate, currentUsdDate);
            }
        }

        // 2. Check EUR
        if (bcvData && bcvData.eur) {
            const currentEurRate = bcvData.eur.rate;
            const currentEurDate = bcvData.value_date || '';

            if (lastKnownRates.eur.rate === null) {
                lastKnownRates.eur = { rate: currentEurRate, date: currentEurDate };
                console.log(`ℹ️ Tasa EUR inicializada: ${currentEurRate}`);
            } else if (currentEurRate !== lastKnownRates.eur.rate || currentEurDate !== lastKnownRates.eur.date) {
                console.log(`🔔 Cambio detectado en EUR: ${lastKnownRates.eur.rate} -> ${currentEurRate}`);
                lastKnownRates.eur = { rate: currentEurRate, date: currentEurDate };
                notifyUsers('EUR', currentEurRate, currentEurDate);
            }
        }

        // SAVE HISTORY AT 7 PM (Closing Rate)
        if (hours === 19 && minutes === 0) {
            console.log('💾 Guardando cierre del día (7 PM)...');
            const historyFile = 'history.json';
            let history = [];

            if (fs.existsSync(historyFile)) {
                try {
                    history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                } catch (e) {
                    console.error('Error leyendo history.json', e);
                }
            }

            // Create entry for today
            const todayEntry = {
                timestamp: now.toISOString(),
                rates: {
                    bdv: {
                        usd: { rate: bcvData.usd.rate },
                        eur: { rate: bcvData.eur.rate }
                    }
                }
            };

            // Remove existing entry for today if any (to update it)
            const todayStr = now.toISOString().split('T')[0];
            history = history.filter(h => !h.timestamp.startsWith(todayStr));

            history.push(todayEntry);

            // Limit to last 30 days
            if (history.length > 30) {
                history = history.slice(history.length - 30);
            }

            fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
            console.log('✅ Historial actualizado.');
        }

    } catch (e) {
        console.error("Critical error in monitor loop:", e.message);
    }
}, 60 * 1000); // Check every minute to catch the :00 minute

// Endpoint to save token
app.post('/api/save-token', (req, res) => {
    const { token } = req.body;
    if (!token || !Expo.isExpoPushToken(token)) {
        return res.status(400).send('Token inválido');
    }

    if (!pushTokens.includes(token)) {
        pushTokens.push(token);
        saveTokens();
        console.log('✅ Nuevo token registrado:', token);
    }

    res.send({ success: true });
});

app.get('/api/rates', async (req, res) => {
    console.log('📊 Request received for /api/rates');

    try {
        // Fetch all rates in parallel
        const [bcvData] = await Promise.all([
            getBCVRate()
        ]);

        const rates = {};

        if (bcvData) {
            rates.bdv = bcvData; // Mantenemos 'bdv' para compatibilidad con la app actual
        }

        const responseData = {
            rates: rates,
            timestamp: new Date().toISOString(),
            cached: false
        };

        console.log('✅ Sending real data');
        res.json(responseData);
    } catch (error) {
        console.error('❌ Error in /api/rates:', error.message);
        res.status(500).json({ error: 'Failed to fetch rates', details: error.message });
    }
});

app.get('/api/history', (req, res) => {
    const HISTORY_FILE = 'history.json';
    if (fs.existsSync(HISTORY_FILE)) {
        try {
            const historyData = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
            res.json(historyData);
        } catch (e) {
            console.error('Error reading history file:', e);
            res.status(500).send('Error reading history');
        }
    } else {
        res.json([]);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Network access: http://192.168.101.8:${PORT}`);
});
