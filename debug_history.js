const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();

async function checkHistory() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { family: 4 });
        console.log('✅ Connected to MongoDB');

        const now = new Date();
        const caracasDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
        console.log('🕒 Server Time (UTC):', now.toISOString());
        console.log('🇻🇪 Server Time (Caracas):', caracasDate.toString());
        console.log('📅 Caracas DateKey:', caracasDate.toISOString().split('T')[0]);

        const history = await mongoose.connection.collection('ratehistories').find({}).sort({ date: 1 }).toArray();
        console.log('\n📊 Rate History Entries:');
        history.forEach(h => {
            console.log(` - [${h.date}]: ${h.rates?.bdv?.usd?.rate} (Timestamp: ${h.timestamp})`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

checkHistory();
