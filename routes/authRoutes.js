const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../services/emailService');
const router = express.Router();

// --- AUTH API ---

router.get('/debug-email', async (req, res) => {
    try {
        const testEmail = 'waldobeatmaker@gmail.com';
        console.log(`🔍 Debugging Email to ${testEmail}...`);

        const mailOptions = {
            from: `"Debug" <${process.env.EMAIL_USER}>`,
            to: testEmail,
            subject: 'Debug Email Test from Render',
            text: 'Si ves esto, el backend puede enviar correos.'
        };

        const info = await transporter.sendMail(mailOptions);
        res.json({ success: true, messageId: info.messageId, user: process.env.EMAIL_USER });
    } catch (error) {
        console.error("❌ Email Debug Error:", error);
        res.status(500).json({
            success: false,
            error: error.message,
            code: error.code,
            details: error
        });
    }
});

router.post('/register', async (req, res) => {
    try {
        console.log('📝 Register request received');
        const { name, email, password, premiumCode, isGiftRegistration } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
        if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El correo ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);
        // Eliminate verification code step
        const vCode = null;
        // Normal users become active immediately. Gift registrations might still wait if required, but the frontend treats them specially.
        const initialStatus = isGiftRegistration ? 'pendiente' : 'activo';

        const newUser = new User({
            name, email, password: hashedPassword,
            verificationCode: vCode,
            status: initialStatus,
            active: !isGiftRegistration,
            isPremium: premiumCode === '123123ABCD',
            premiumType: premiumCode === '123123ABCD' ? 'plus' : null
        });

        if (isGiftRegistration) {
            newUser.active = false;
        }

        const saved = await newUser.save();
        console.log(`👤 User saved: ${saved._id}`);

        // If Gift Registration, SKIP EMAIL
        if (isGiftRegistration) {
            console.log('🎁 Gift Registration: Skipping email verification.');
            return res.status(201).json({
                id: saved._id,
                status: 'inactive', // Custom status for frontend handling
                message: 'Registro exitoso. Tu usuario se activará cuando comience la jornada premium.',
                isGiftRegistration: true
            });
        }

        // Enviar correo real con Timeout for NORMAL registration is now bypassed because verification code is eliminated

        console.log('🚀 Sending 201 response back to app...');
        res.status(201).json({
            id: saved._id,
            status: isGiftRegistration ? 'pendiente' : 'activo',
            message: 'Registro exitoso.',
            devCode: null
        });
    } catch (err) {
        console.error('❌ Fatal Register Error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/verify', async (req, res) => {
    try {
        const { email, code } = req.body;
        const user = await User.findOne({ email, verificationCode: code });

        if (!user) return res.status(400).json({ error: 'Código incorrecto o correo inválido' });

        user.status = 'activo';
        user.verificationCode = null; // Limpiar código
        await user.save();

        res.json({ success: true, message: 'Cuenta activada correctamente' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

        // Eliminado: Bloqueo de inicio de sesión por cuenta pendiente de activación
        // ya que el envío de correos está temporalmente bloqueado.

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            isPremium: user.isPremium,
            premiumType: user.premiumType,
            expiresAt: user.expiresAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Premium Status (Manual or Code)
router.post('/premium', async (req, res) => {
    try {
        const { userId, isPremium, expiresAt, premiumType } = req.body;
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        user.isPremium = isPremium;
        user.premiumType = premiumType;
        user.expiresAt = expiresAt ? new Date(expiresAt) : null;

        await user.save();

        res.json({
            success: true,
            isPremium: user.isPremium,
            premiumType: user.premiumType,
            expiresAt: user.expiresAt
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
