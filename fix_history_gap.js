const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

async function fixHistory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('✅ Connected to MongoDB');

        const RateHistory = mongoose.model('RateHistory', new mongoose.Schema({
            date: String,
            timestamp: Date,
            rates: Object
        }));

        // 1. Check for Feb 05
        const dateKey = '2026-02-05';
        const exists = await RateHistory.findOne({ date: dateKey });

        if (!exists) {
            console.log(`⚠️ Missing entry for ${dateKey}. Inserting user-provided rate: 378.46`);
            await new RateHistory({
                date: dateKey,
                timestamp: new Date('2026-02-05T12:00:00-04:00'), // Noon Caracas
                rates: {
                    bdv: {
                        usd: { rate: 378.46 }
                    }
                }
            }).save();
            console.log("✅ Fixed: Inserted Feb 05 entry.");
        } else {
            console.log(`ℹ️ Entry for ${dateKey} already exists. Updating rate to 378.46...`);
            exists.rates.bdv.usd.rate = 378.46;
            await exists.save();
            console.log("✅ Updated Feb 05 entry.");
        }

        // 2. Ensure Feb 06 is kept (Tomorrow)
        const tomorrowKey = '2026-02-06';
        const tomorrow = await RateHistory.findOne({ date: tomorrowKey });
        if (tomorrow) {
            console.log(`ℹ️ Entry for ${tomorrowKey} (Tomorrow) exists: ${tomorrow.rates.bdv.usd.rate}`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

fixHistory();
