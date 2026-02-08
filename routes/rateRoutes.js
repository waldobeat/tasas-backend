const express = require('express');
const fs = require('fs');
const path = require('path');
const { getBCVRate } = require('../services/bcv');
const router = express.Router();

const HISTORY_FILE = path.join(__dirname, '../history.json');

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
        if (!fs.existsSync(HISTORY_FILE)) {
            return res.json([]);
        }
        const data = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        // The file is already sorted in this project, but we can ensure it if needed.
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Error reading history' });
    }
});

module.exports = router;
