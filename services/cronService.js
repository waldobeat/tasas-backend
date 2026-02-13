const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getBCVRate } = require('./bcv');
const { getBinanceRate } = require('./binance');
const { broadcastNotification } = require('../utils/pushNotifications');

const HISTORY_FILE = path.join(__dirname, '../history.json');

const checkAndLogRate = async () => {
    console.log('⏰ Checking for Rate Updates...');
    try {
        // Fetch both rates
        const [bcvData, binanceData] = await Promise.all([
            getBCVRate().catch(e => null),
            getBinanceRate().catch(e => null)
        ]);

        if (!bcvData || !bcvData.usd || !bcvData.usd.rate) {
            console.log('⚠️ BCV fetch failed or empty.');
            return;
        }

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

        const newBCVRate = bcvData.usd.rate;
        const newBinanceRate = binanceData ? binanceData.rate : 0;

        const lastEntry = history.length > 0 ? history[history.length - 1] : null;

        // Check BCV changes
        const lastBCVRate = lastEntry && lastEntry.rates && lastEntry.rates.bdv ? lastEntry.rates.bdv.usd.rate : 0;
        const lastBinanceRate = lastEntry && lastEntry.rates && lastEntry.rates.binance ? lastEntry.rates.binance.usd.rate : 0;

        const lastValueDate = lastEntry ? lastEntry.value_date : '';
        const valueDateChanged = bcvData.value_date && bcvData.value_date !== lastValueDate;
        const bcvChanged = Math.abs(newBCVRate - lastBCVRate) > 0.0001;

        // Binance changes naturally all the time, so we check if it is valid (non-zero) and different
        const binanceChanged = newBinanceRate > 0 && Math.abs(newBinanceRate - lastBinanceRate) > 0.001;

        // Update if BCV changed OR Binance Changed OR Value Date Changed
        // NOTE: We only notify for BCV.
        if (bcvChanged || valueDateChanged || binanceChanged) {

            const newEntry = {
                timestamp: new Date().toISOString(),
                date: dateKey,
                value_date: bcvData.value_date || dateKey,
                rates: {
                    bdv: {
                        usd: { rate: newBCVRate },
                        eur: { rate: bcvData.eur.rate }
                    }
                }
            };

            // Add Binance only if available, otherwise keep last known or skip
            if (newBinanceRate > 0) {
                newEntry.rates.binance = {
                    usd: { rate: newBinanceRate } // Binance P2P is essentially USD
                };
            } else if (lastBinanceRate > 0) {
                // Keep previous if fetch failed
                newEntry.rates.binance = {
                    usd: { rate: lastBinanceRate }
                };
            }

            // --- HISTORY LOGIC FIX ---
            // Check if last entry is from TODAY (by dateKey)
            // If so, OVERWRITE it. If not, PUSH new.
            let updated = false;
            if (history.length > 0) {
                const lastHistoryDate = history[history.length - 1].date;
                if (lastHistoryDate === dateKey) {
                    // Update existing
                    history[history.length - 1] = newEntry;
                    updated = true;
                    console.log(`🔄 Updated existing entry for ${dateKey}`);
                }
            }

            if (!updated) {
                history.push(newEntry);
                console.log(`➕ Added new entry for ${dateKey}`);
            }

            // Limit history (Keep last 100 DAYS now, not just 100 updates)
            if (history.length > 100) history = history.slice(-100);

            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
            console.log(`✅ Rates Processed | BCV: ${newBCVRate} | Binance: ${newBinanceRate}`);

            // SEND NOTIFICATION ONLY FOR BCV CHANGES
            if (bcvChanged || valueDateChanged) {
                const title = "🔔 ¡El Dólar BCV ha cambiado!";
                const body = `Nueva Tasa: ${newBCVRate} VES/USD\nFecha Valor: ${bcvData.value_date || 'Hoy'}`;
                await broadcastNotification(title, body, { rate: newBCVRate });
            }

        } else {
            console.log(`ℹ️ Rates unchanged. No update.`);
        }

    } catch (e) {
        console.error('Error in checkAndLogRate:', e);
    }
};

const setupCronJobs = () => {
    const timezone = "America/Caracas";

    // Run every 2 minutes for real-time updates (Binance)
    cron.schedule('*/2 * * * *', async () => {
        console.log(`⏰ Cron Triggered: ${new Date().toLocaleTimeString('es-VE', { timeZone: timezone })}`);
        await checkAndLogRate();
    }, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    // Run immediately on startup to check
    checkAndLogRate();
};

module.exports = { setupCronJobs };
