const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

async function testBCV() {
    try {
        console.log('Consultando BCV...');

        // BCV suele tener certificado autofirmado o problemas, usamos rejectUnauthorized: false
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const response = await axios.get('https://www.bcv.org.ve/', {
            httpsAgent: agent,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        // Los selectores del BCV suelen ser:
        // #dolar .field-content .cerco-result-row
        // Ojo: BCV cambia a veces. Busquemos por ID habituales.

        const usdRate = $('#dolar strong').text().trim();
        const eurRate = $('#euro strong').text().trim();

        // Selector común para la fecha en la home del BCV (suele estar en un bloque cerca de las tasas)
        // Buscamos algo que contenga "Fecha Valor" en todo el texto o un selector específico
        // En la estructura actual suele ser algo como .dinpro.center o similar.
        // Vamos a intentar buscar el texto "Fecha Valor" y tomar su padre

        // Intento 2: Buscar por clases comunes donde suele estar la fecha
        // En muchos casos es .pull-right.dinpro.center
        let fechaValor = $('.pull-right.dinpro.center').text().trim();

        // Si falla, buscar en todo el texto del bloque de tasas
        if (!fechaValor) {
            const wholeText = $('#block-views-tasas-del-sistema-de-mercado-de-cambio-block').text();
            // Buscar patrón de fecha: "Día, DD Mes YYYY"
            const dateMatch = wholeText.match(/[a-zA-Záéíóú]+, \d{2} [a-zA-Z]+ \d{4}/);
            if (dateMatch) {
                fechaValor = dateMatch[0];
            }
        }

        // Limpiar "Fecha Valor: " si existe
        fechaValor = fechaValor.replace('Fecha Valor:', '').trim();

        console.log('--- RESULTADOS ---');
        console.log('USD:', usdRate);
        console.log('EUR:', eurRate);
        console.log('FECHA EXTRAIDA:', fechaValor);

        // Limpieza básica (cambiar coma por punto si es necesario)
        const cleanUsd = parseFloat(usdRate.replace(',', '.'));
        console.log('USD Parsed:', cleanUsd);

    } catch (error) {
        console.error('Error al consultar BCV:', error.message);
    }
}

testBCV();
