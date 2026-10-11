const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

async function getBCVRate() {
    try {
        const agent = new https.Agent({
            rejectUnauthorized: false // BCV a veces tiene problemas de SSL
        });

        const response = await axios.get('https://www.bcv.org.ve/', {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 20000 // 20 segundos timeout
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Selectores del BCV (IDs suelen ser estables)
        const usdRaw = $('#dolar strong').text().trim();
        const eurRaw = $('#euro strong').text().trim();

        // Extraer Fecha Valor
        let fechaValor = $('.pull-right.dinpro.center').text().trim();
        if (!fechaValor) {
            const wholeText = $('#block-views-tasas-del-sistema-de-mercado-de-cambio-block').text();
            // Regex para: Día, DD Mes YYYY (con posibles espacios extra)
            const dateMatch = wholeText.match(/[a-zA-Záéíóú]+,\s+\d{2}\s+[a-zA-Z]+\s+\d{4}/);
            if (dateMatch) {
                fechaValor = dateMatch[0].replace(/\s+/g, ' '); // Normalizar espacios
            }
        }
        fechaValor = fechaValor.replace('Fecha Valor:', '').trim();

        if (usdRaw && eurRaw) {
            // Convertir "36,1234" a 36.1234
            const usdVal = parseFloat(usdRaw.replace(/\./g, '').replace(',', '.'));
            const eurVal = parseFloat(eurRaw.replace(/\./g, '').replace(',', '.'));

            return {
                source: 'Banco Central de Venezuela',
                usd: {
                    symbol: 'USD/VES',
                    rate: usdVal
                },
                eur: {
                    symbol: 'EUR/VES',
                    rate: eurVal
                },
                last_updated: new Date().toISOString(),
                value_date: fechaValor // Nueva propiedad
            };
        }
        return null;

    } catch (error) {
        console.error('Error bcv.org.ve:', error.message);
        return null;
    }
}

module.exports = { getBCVRate };
