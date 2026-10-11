const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const { getBCVRate } = require('./bcv');
const { getBinanceRate } = require('./binance');
const { broadcastNotification } = require('../utils/pushNotifications');

const HISTORY_FILE = path.join(__dirname, '../history.json');

const checkAndLogRate = async (forceBCV = false) => {
    console.log(`⏰ [${new Date().toLocaleTimeString('es-VE', { timeZone: "America/Caracas" })}] Checking for Rate Updates... (BCV Force: ${forceBCV})`);
    try {
        // Fetch rates. If not forcing BCV, we can skip it to save resources/bandwidth if desired, 
        // but the requirement is "Recolección BCV a cada 1 hora".
        // Let's optimize: only fetch BCV if forceBCV is true or if it's been ~1 hour.

        const [bcvData, binanceData] = await Promise.all([
            forceBCV ? getBCVRate().catch(e => { console.error("BCV Fetch Error:", e.message); return null; }) : Promise.resolve(null),
            getBinanceRate().catch(e => { console.error("Binance Fetch Error:", e.message); return null; })
        ]);

        // Load existing history
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;

        const newBinanceRate = binanceData ? binanceData.rate : 0;
        const lastBinanceRate = lastEntry && lastEntry.rates && lastEntry.rates.binance ? lastEntry.rates.binance.usd.rate : 0;
        const binanceChanged = newBinanceRate > 0 && Math.abs(newBinanceRate - lastBinanceRate) > 0.001;

        let shouldUpdate = binanceChanged;
        let bcvUpdated = false;

        const updateEntry = { ...lastEntry } || {
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0],
            rates: {}
        };

        if (bcvData && bcvData.usd && bcvData.usd.rate) {
            const newBCVRate = bcvData.usd.rate;
            const lastBCVRate = lastEntry && lastEntry.rates && lastEntry.rates.bdv ? lastEntry.rates.bdv.usd.rate : 0;
            const lastValueDate = lastEntry ? lastEntry.value_date : '';
            const valueDateChanged = bcvData.value_date && bcvData.value_date !== lastValueDate;
            const bcvChanged = Math.abs(newBCVRate - lastBCVRate) > 0.0001;

            if (bcvChanged || valueDateChanged) {
                console.log(`[CRON] BCV Changed! Rate: ${newBCVRate} | Date: ${bcvData.value_date}`);
                updateEntry.value_date = bcvData.value_date || updateEntry.date;
                updateEntry.rates.bdv = {
                    usd: { rate: newBCVRate },
                    eur: { rate: bcvData.eur.rate }
                };
                shouldUpdate = true;
                bcvUpdated = true;
            }
        }

        if (binanceChanged) {
            console.log(`[CRON] Binance Changed! Rate: ${newBinanceRate}`);
            updateEntry.rates.binance = { usd: { rate: newBinanceRate } };
            shouldUpdate = true;
        }

        if (shouldUpdate) {
            updateEntry.timestamp = new Date().toISOString();

            // Manage history logic (Overwrite if same day or push)
            let dateKey = updateEntry.date || new Date().toISOString().split('T')[0];
            if (bcvData && bcvData.value_date) {
                // Extract dateKey from value_date logic ... (keeping original logic for consistency)
                const months = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };
                try {
                    const parts = (bcvData.value_date.split(',')[1]?.trim() || bcvData.value_date).split(/\s+/);
                    if (parts.length >= 3) {
                        const m = months[parts[1].toLowerCase()];
                        if (m && parts[2]) dateKey = `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`;
                    }
                } catch (e) { }
            }
            updateEntry.date = dateKey;

            if (history.length > 0 && history[history.length - 1].date === dateKey) {
                history[history.length - 1] = updateEntry;
            } else {
                history.push(updateEntry);
            }

            if (history.length > 100) history = history.slice(-100);
            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));

            // Notify only if BCV updated
            if (bcvUpdated) {
                const title = "🔔 ¡El Dólar BCV ha cambiado!";
                const body = `Nueva Tasa: ${updateEntry.rates.bdv.usd.rate} VES/USD\nFecha Valor: ${updateEntry.value_date}`;
                await broadcastNotification(title, body, { rate: updateEntry.rates.bdv.usd.rate });
            }
        } else {
            console.log("ℹ️ No significant changes detected.");
        }

    } catch (e) {
        console.error('Error in checkAndLogRate:', e);
    }
};

const setupCronJobs = () => {
    const timezone = "America/Caracas";

    // 1. Binance Check: every 2 minutes
    cron.schedule('*/2 * * * *', async () => {
        await checkAndLogRate(false); // Only Binance normally
    }, { scheduled: true, timezone });

    // 2. BCV Check: every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log("🕒 Hourly BCV sync triggered...");
        await checkAndLogRate(true); // Force BCV check
    }, { scheduled: true, timezone });

    // Initial run (Force both)
    checkAndLogRate(true);
};

module.exports = { setupCronJobs };
