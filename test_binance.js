const https = require('https');
const zlib = require('zlib');

const data = JSON.stringify({
    "fiat": "VES",
    "page": 1,
    "rows": 10,
    "tradeType": "BUY",
    "asset": "USDT", // USDT is the standard proxy for "Dollar Binance"
    "payTypes": [] // Empty array means all pay types
});

const options = {
    hostname: 'p2p.binance.com',
    port: 443,
    path: '/bapi/c2c/v2/friendly/c2c/adv/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Encoding': 'gzip'
    }
};

const req = https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`);
    console.log(`headers:`, res.headers);

    let stream = res;
    if (res.headers['content-encoding'] === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
    }

    let body = '';
    stream.on('data', d => {
        body += d;
    });

    stream.on('end', () => {
        try {
            const json = JSON.parse(body);
            if (json.data && Array.isArray(json.data)) {
                // Filter out non-merchant or suspicious ones if needed, but for now just average top 5
                const rates = json.data.map(item => parseFloat(item.adv.price));
                console.log('Top rates:', rates.slice(0, 5));

                const avg = rates.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(rates.length, 5);
                console.log('Average Top 5:', avg);
            } else {
                console.log('Unexpected structure:', json);
            }
        } catch (e) {
            console.error('Error parsing JSON:', e);
            console.log('Body:', body.substring(0, 100));
        }
    });
});

req.on('error', error => {
    console.error(error);
});

req.write(data);
req.end();
