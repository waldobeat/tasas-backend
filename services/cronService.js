const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getBCVRate } = require('./bcv');
const { broadcastNotification } = require('../utils/pushNotifications');

const HISTORY_FILE = path.join(__dirname, '../history.json');

const checkAndLogRate = async () => {
    console.log('⏰ Checking for Rate Updates...');
    try {
        const bcvData = await getBCVRate().catch(e => null);
        if (!bcvData || !bcvData.usd || !bcvData.usd.rate) return;

        let dateKey;
        if (bcvData.value_date) {
            const months = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };
            try {
                // Split by comma first, then by one or more spaces to avoid empty clusters
                const parts = (bcvData.value_date.split(',')[1]?.trim() || bcvData.value_date).split(/\s+/);
                if (parts.length >= 3) {
                    const m = months[parts[1].toLowerCase()];
                    if (m && parts[2]) dateKey = `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`;
                }
            } catch (e) { }
        }
        if (!dateKey) dateKey = new Date().toISOString().split('T')[0];

        // Read history.json
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }

        const newRateVal = bcvData.usd.rate;
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const lastRateVal = lastEntry ? lastEntry.rates.bdv.usd.rate : 0;

        // Condition to update: 
        // 1. History is empty 
        // OR 2. Rate has CHANGED significantly (avoids float jitter, though BCV is usually precise)
        // OR 3. It's a new day (dateKey check inside logic if needed, but rate change is primary trigger for notification)

        // We only append if the rate is DIFFERENT from the last entry. 
        // If it's the same rate but a new day (unlikely for BCV to not change, but possible), we might just want to update the timestamp or ignore.
        // For simplicity: If Rate != LastRate, we Add + Notify.

        const lastValueDate = lastEntry ? lastEntry.value_date : '';
        const valueDateChanged = bcvData.value_date && bcvData.value_date !== lastValueDate;

        if (Math.abs(newRateVal - lastRateVal) > 0.0001 || valueDateChanged) {
            const newEntry = {
                timestamp: new Date().toISOString(),
                date: dateKey,
                value_date: bcvData.value_date || dateKey,
                rates: { bdv: { usd: { rate: newRateVal }, eur: { rate: bcvData.eur.rate } } }
            };

            history.push(newEntry);

            // Limit history
            if (history.length > 100) history = history.slice(-100);

            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
            console.log(`✅ New Rate Logged: ${newRateVal} (Old: ${lastRateVal})`);

            // SEND NOTIFICATION
            const title = "🔔 ¡El Dólar BCV ha cambiado!";
            const body = `Nueva Tasa: ${newRateVal} VES/USD\nFecha Valor: ${bcvData.value_date || 'Hoy'}`;
            await broadcastNotification(title, body, { rate: newRateVal });

        } else {
            console.log(`ℹ️ Rate unchanged (${newRateVal}). No update.`);
        }

    } catch (e) {
        console.error('Error in checkAndLogRate:', e);
    }
};

const setupCronJobs = () => {
    const timezone = "America/Caracas";

    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log(`⏰ Hourly Cron Triggered: ${new Date().toLocaleTimeString('es-VE', { timeZone: timezone })}`);
        await checkAndLogRate();
    }, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    // Run immediately on startup to check
    checkAndLogRate();
};

module.exports = { setupCronJobs };
