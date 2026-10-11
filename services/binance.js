const https = require('https');
const zlib = require('zlib');

const getBinanceRate = () => {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            "fiat": "VES",
            "page": 1,
            "rows": 10,
            "tradeType": "BUY",
            "asset": "USDT",
            "payTypes": []
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
                    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
                        // Average top 5
                        const rates = json.data.map(item => parseFloat(item.adv.price));
                        const top5 = rates.slice(0, 5);
                        const avg = top5.reduce((a, b) => a + b, 0) / top5.length;

                        resolve({
                            rate: avg,
                            raw_top_5_avg: avg
                        });
                    } else {
                        // If structure changes or empty
                        console.warn('[Binance] Unexpected response structure', json);
                        resolve(null);
                    }
                } catch (e) {
                    console.error('[Binance] Error parsing JSON:', e);
                    resolve(null);
                }
            });
        });

        req.on('error', error => {
            console.error('[Binance] Network Error:', error);
            resolve(null); // Resolve null to not break the chain
        });

        req.write(data);
        req.end();
    });
};

module.exports = { getBinanceRate };
