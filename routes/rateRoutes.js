const express = require('express');
const { getBCVRate } = require('../services/bcv');
const RateHistory = require('../models/RateHistory');
const router = express.Router();

// --- RATES & HISTORY ---
router.get('/rates', async (req, res) => {
    try {
        const bcvData = await getBCVRate();
        res.json({ rates: { bdv: bcvData }, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching rates' });
    }
});

router.get('/history', async (req, res) => {
    try {
        // Return sorted by date ascending
        const history = await RateHistory.find().sort({ date: 1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching history' });
    }
});

module.exports = router;
