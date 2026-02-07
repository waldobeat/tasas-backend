const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense', 'debt', 'receivable', 'pay', 'DEBO', 'Gasto (Deuda)'], required: true },
    amount: { type: Number, required: true },
    category: { type: String, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'completed'], default: 'completed' },
    note: { type: String },
    completed: { type: Boolean, default: false },
    // Debt specific fields
    debtType: { type: String, enum: ['loan', 'credit', null], default: null },
    obtainedDate: { type: Date, default: null },
    payments: [{
        id: { type: String },
        amount: { type: Number, required: true },
        date: { type: Date, required: true }
    }],
    installments: [{
        date: { type: Date, required: true },
        amount: { type: Number, required: true },
        paid: { type: Boolean, default: false }
    }]
});

module.exports = mongoose.model('Transaction', transactionSchema);
