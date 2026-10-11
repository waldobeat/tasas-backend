const axios = require('axios');

async function getMSNRate() {
    try {
        // Usamos una API pública fiable basada en datos de mercado (similar a lo que usa Microsoft/Bing)
        // para asegurar estabilidad y evitar bloqueos por scraping.
        // open.er-api.com ofrece tasas actualizadas diariamente/horarias.

        const [usdRes, eurRes] = await Promise.all([
            axios.get('https://open.er-api.com/v6/latest/USD'),
            axios.get('https://open.er-api.com/v6/latest/EUR')
        ]);

        const usdRate = usdRes.data.rates.VES;
        const eurRate = eurRes.data.rates.VES;

        if (usdRate && eurRate) {
            return {
                source: 'Microsoft Money (Ref)', // Etiqueta para la UI
                usd: {
                    symbol: 'USD/VES',
                    rate: usdRate.toString() // Mantener formato string si la app lo espera así o número
                },
                eur: {
                    symbol: 'EUR/VES',
                    rate: eurRate.toString()
                },
                last_updated: new Date().toISOString()
            };
        }
        return null;

    } catch (error) {
        console.error('Error fetching rates:', error.message);
        return null;
    }
}

module.exports = { getMSNRate };
