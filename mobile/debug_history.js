const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio'); // You might need this if getBCVRate uses it, or import the service
// Since getBCVRate is in ./services/bcv, I'll try to import it, or reimplement simple fetch if needed.
// IMPORTANT: Adjust path to services/bcv if needed.
const { getBCVRate } = require('../services/bcv');
require('dotenv').config({ path: '../.env' });

const rateHistorySchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true },
    timestamp: { type: Date, default: Date.now },
    rates: {
        bdv: {
            usd: { rate: Number }
        }
    }
});

const RateHistory = mongoose.model('RateHistory', rateHistorySchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to DB');

        const allDocs = await RateHistory.find().sort({ date: 1 });
        console.log('📊 Current History in DB:');
        allDocs.forEach(d => console.log(` - ${d.date}: ${d.rates.bdv.usd.rate} (TS: ${d.timestamp})`));

        const now = new Date();
        const caracasDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
        const dateKey = caracasDate.toISOString().split('T')[0];

        console.log(`📅 Today (Caracas): ${dateKey}`);

        const exists = await RateHistory.findOne({ date: dateKey });
        if (exists) {
            console.log('✅ Today entry ALREADY EXISTS.');
        } else {
            console.log('⚠️ Today entry MISSING. Fetching rate...');
            const bcvData = await getBCVRate();
            console.log('💱 BCV Data:', bcvData);

            if (bcvData && bcvData.usd) {
                await new RateHistory({
                    date: dateKey,
                    timestamp: now,
                    rates: {
                        bdv: {
                            usd: { rate: bcvData.usd.rate }
                        }
                    }
                }).save();
                console.log('✅ SAVED today\'s rate manually.');
            } else {
                console.error('❌ Could not fetch BCV data.');
            }
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();
