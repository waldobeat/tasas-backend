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
                const parts = (bcvData.value_date.split(',')[1]?.trim() || bcvData.value_date).split(/\s+/);
                if (parts.length >= 3) {
                    const m = months[parts[1].toLowerCase()];
                    if (m && parts[2]) dateKey = `${parts[2]}-${m}-${parts[0].padStart(2, '0')}`;
                }
            } catch (e) { }
        }
        if (!dateKey) dateKey = new Date().toISOString().split('T')[0];

        // Leer historial
        let history = [];
        if (fs.existsSync(HISTORY_FILE)) {
            history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }

        // Tasas actuales vs anteriores
        const newUsdVal = bcvData.usd.rate;
        const newEurVal = bcvData.eur.rate;
        
        const lastEntry = history.length > 0 ? history[history.length - 1] : null;
        const lastUsdVal = lastEntry ? lastEntry.rates.bdv.usd.rate : 0;
        const lastEurVal = lastEntry ? lastEntry.rates.bdv.eur.rate : 0;

        const lastValueDate = lastEntry ? lastEntry.value_date : '';
        const valueDateChanged = bcvData.value_date && bcvData.value_date !== lastValueDate;

        // CONDICIÓN: Se dispara si cambia el USD, el EUR o la fecha de vigencia
        const usdChanged = Math.abs(newUsdVal - lastUsdVal) > 0.0001;
        const eurChanged = Math.abs(newEurVal - lastEurVal) > 0.0001;

        if (usdChanged || eurChanged || valueDateChanged) {
            const newEntry = {
                timestamp: new Date().toISOString(),
                date: dateKey,
                value_date: bcvData.value_date || dateKey,
                rates: { 
                    bdv: { 
                        usd: { rate: newUsdVal }, 
                        eur: { rate: newEurVal } 
                    } 
                }
            };

            history.push(newEntry);

            // Mantener solo los últimos 100 registros
            if (history.length > 100) history = history.slice(-100);

            fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
            console.log(`✅ Nuevo registro: USD ${newUsdVal} | EUR ${newEurVal}`);

            // NOTIFICACIÓN PUSH CON AMBAS MONEDAS
            const title = "🔔 ¡Nuevas Tasas BCV!";
            const body = `💵 Dólar: ${newUsdVal} VES\n` +
                         `💶 Euro: ${newEurVal} VES\n` +
                         `📅 Fecha Valor: ${bcvData.value_date || 'Hoy'}`;

            await broadcastNotification(title, body, { 
                usd: newUsdVal, 
                eur: newEurVal,
                date: bcvData.value_date
            });

        } else {
            console.log(`ℹ️ Tasas sin cambios (USD: ${newUsdVal}). No hay actualización.`);
        }

    } catch (e) {
        console.error('Error in checkAndLogRate:', e);
    }
};

const setupCronJobs = () => {
    const timezone = "America/Caracas";

    // Se ejecuta cada hora al minuto 0
    cron.schedule('0 * * * *', async () => {
        console.log(`⏰ Cron activado: ${new Date().toLocaleTimeString('es-VE', { timeZone: timezone })}`);
        await checkAndLogRate();
    }, {
        scheduled: true,
        timezone: timezone
    });

    // Ejecución inmediata al arrancar el servidor
    checkAndLogRate();
};

module.exports = { setupCronJobs };
