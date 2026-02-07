const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isPremium: { type: Boolean, default: false },
    premiumType: { type: String, enum: ['plus', '30', 'free', null], default: null },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ['pendiente', 'activo'], default: 'pendiente' },
    verificationCode: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
