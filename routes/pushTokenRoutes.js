const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const TOKENS_FILE = path.join(__dirname, '../tokens.json');

router.post('/', (req, res) => {
    const { token, userId } = req.body; // Accept userId

    if (!token) return res.status(400).json({ error: 'Token es requerido' });

    let tokens = {};
    if (fs.existsSync(TOKENS_FILE)) {
        try {
            tokens = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        } catch (e) { tokens = {}; }
    }

    // Store token with userId metadata
    tokens[token] = { userId: userId || null, updatedAt: new Date() };

    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2));

    res.json({ success: true });
});

module.exports = router;
