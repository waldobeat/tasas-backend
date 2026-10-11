const express = require('express');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const authMiddleware = require('../middleware/authMiddleware'); // Importar el middleware
const router = express.Router();

// --- FINANCE API ---
// Aplicar middlewares de autenticación a TODAS las rutas financieras
router.use(authMiddleware);

router.get('/:userId', async (req, res) => {
    console.log(`[FINANCE] Fetching transactions for user: ${req.params.userId}`);
    try {
        // Validar identidad: El usuario solicitante debe ser el mismo del token
        if (req.user.id !== req.params.userId) {
            console.log(`[FINANCE] Unauthorized GET attempt by ${req.user.id} for ${req.params.userId}`);
            return res.status(403).json({ error: 'Acceso denegado: No puedes ver transacciones de otro usuario' });
        }

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
        // Validar que el userId de la transacción sea del usuario autenticado
        if (req.user.id !== req.body.userId) {
            console.log(`[FINANCE] Unauthorized POST attempt by ${req.user.id} for ${req.body.userId}`);
            return res.status(403).json({ error: 'Acceso denegado: No puedes registrar transacciones a nombre de otro usuario' });
        }

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

        // Buscar la transacción primero
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: 'No encontrado' });

        // Verificamos propiedad
        if (transaction.userId.toString() !== req.user.id) {
            console.log(`[FINANCE] Unauthorized DELETE attempt by ${req.user.id} on ${req.params.id}`);
            return res.status(403).json({ error: 'Acceso denegado: Esta transacción no te pertenece' });
        }

        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido' });

        // Buscar la transacción primero
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ error: 'No encontrado' });

        // Verificamos propiedad
        if (transaction.userId.toString() !== req.user.id) {
            console.log(`[FINANCE] Unauthorized PUT attempt by ${req.user.id} on ${req.params.id}`);
            return res.status(403).json({ error: 'Acceso denegado: Esta transacción no te pertenece' });
        }

        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
