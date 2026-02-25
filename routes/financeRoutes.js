const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const router = express.Router();

// --- FINANCE API ---
router.get('/:userId', async (req, res) => {
    console.log(`[FINANCE] Fetching transactions for user: ${req.params.userId}`);
    try {
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        console.error(`[FINANCE] Error fetching:`, err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/', async (req, res) => {
    console.log(`[FINANCE] Saving transaction:`, JSON.stringify(req.body));
    try {
        const newTrans = new Transaction(req.body);
        const saved = await newTrans.save();
        console.log(`[FINANCE] Saved successfully: ${saved._id}`);
        res.status(201).json(saved);
    } catch (err) {
        console.error(`[FINANCE] Error saving:`, err.message);
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'No encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
