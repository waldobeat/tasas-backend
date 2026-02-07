const { getBCVRate } = require('./bcv');
const { notifyUsers } = require('./notificationService');

let lastKnownRates = {
    usd: { rate: null, date: null },
    eur: { rate: null, date: null }
};

const startMonitoring = () => {
    console.log('👀 Starting Rate Monitor...');

    setInterval(async () => {
        const now = new Date();
        const caracas = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
        const hours = caracas.getHours();

        // Monitor only during day (e.g., 7 AM to 7 PM) or adjust as needed
        if (hours < 7 || hours >= 20) return;

        try {
            const bcvData = await getBCVRate().catch(e => { console.error("BCV Error:", e.message); return null; });
            if (!bcvData) return;

            // 1. Check USD
            if (bcvData.usd) {
                const currentUsdRate = bcvData.usd.rate;
                const currentUsdDate = bcvData.value_date || '';

                if (lastKnownRates.usd.rate !== currentUsdRate || lastKnownRates.usd.date !== currentUsdDate) {
                    if (lastKnownRates.usd.rate !== null) { // Don't notify on first run/startup
                        console.log(`🔔 Cambio detectado en USD: ${lastKnownRates.usd.rate} -> ${currentUsdRate}`);
                        notifyUsers({
                            title: '📢 Cambio de Tasa USD',
                            body: `El Dólar ha cambiado a ${currentUsdRate} Bs.\nFecha Valor: ${currentUsdDate}`,
                            data: { currency: 'USD', rate: currentUsdRate, date: currentUsdDate }
                        });
                    }
                    lastKnownRates.usd = { rate: currentUsdRate, date: currentUsdDate };
                }
            }

            // 2. Check EUR
            if (bcvData.eur) {
                const currentEurRate = bcvData.eur.rate;
                // EUR might share value_date with USD usually
                const currentEurDate = bcvData.value_date || '';

                if (lastKnownRates.eur.rate !== currentEurRate || lastKnownRates.eur.date !== currentEurDate) {
                    if (lastKnownRates.eur.rate !== null) {
                        console.log(`🔔 Cambio detectado en EUR: ${lastKnownRates.eur.rate} -> ${currentEurRate}`);
                        notifyUsers({
                            title: '📢 Cambio de Tasa EUR',
                            body: `El Euro ha cambiado a ${currentEurRate} Bs.\nFecha Valor: ${currentEurDate}`,
                            data: { currency: 'EUR', rate: currentEurRate, date: currentEurDate }
                        });
                    }
                    lastKnownRates.eur = { rate: currentEurRate, date: currentEurDate };
                }
            }

        } catch (e) { console.error("Monitor error", e.message); }
    }, 30 * 60 * 1000); // Check every 30 mins
};

module.exports = { startMonitoring };
