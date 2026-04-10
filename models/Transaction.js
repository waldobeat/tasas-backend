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
    provider: { type: String, default: null }, // Added provider
    obtainedDate: { type: Date, default: null },
    installments: [{
        number: { type: Number },
        amount: { type: Number, required: true },
        dueDate: { type: Date, required: true },
        status: { type: String, enum: ['pending', 'paid', 'overdue'], default: 'pending' },
        paidDate: { type: Date }
    }],
    payments: [{ // Keeping for backward compatibility or direct payments
        id: { type: String },
        amount: { type: Number, required: true },
        date: { type: Date, required: true }
    }]
});

module.exports = mongoose.model('Transaction', transactionSchema);
