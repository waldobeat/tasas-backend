const mongoose = require('mongoose');

const rateHistorySchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    timestamp: { type: Date, default: Date.now },
    rates: {
        bdv: {
            usd: { rate: Number }
        }
    }
});

module.exports = mongoose.model('RateHistory', rateHistorySchema);
