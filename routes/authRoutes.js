const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const transporter = require('../services/emailService');
const router = express.Router();

// --- AUTH API ---
router.post('/register', async (req, res) => {
    try {
        console.log('📝 Register request received');
        const { name, email, password, premiumCode } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Faltan datos' });
        if (password.length < 6) return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'El correo ya existe' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const vCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            name, email, password: hashedPassword,
            verificationCode: vCode,
            isPremium: premiumCode === '123123ABCD',
            premiumType: premiumCode === '123123ABCD' ? 'plus' : null
        });

        const saved = await newUser.save();
        console.log(`👤 User saved: ${saved._id}`);

        // Enviar correo real con Timeout
        const mailOptions = {
            from: `"La Tasa" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Código de Verificación - La Tasa',
            text: `Hola ${name},\n\nTu código de verificación para activar tu cuenta en La Tasa es: ${vCode}\n\nIngrésalo en la aplicación para completar tu registro.`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                    <h2>¡Hola ${name}!</h2>
                    <p>Bienvenido a <b>La Tasa</b>. Para completar tu registro, utiliza el siguiente código de verificación:</p>
                    <div style="font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 10px; text-align: center; border-radius: 5px; color: #4F46E5;">
                        ${vCode}
                    </div>
                    <p style="margin-top: 20px; color: #666;">Si no solicitaste este registro, puedes ignorar este correo.</p>
                   </div>`
        };

        let emailSent = false;
        try {
            if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                console.log(`📧 Attempting to send email to ${email}...`);
                const info = await Promise.race([
                    transporter.sendMail(mailOptions),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 4000))
                ]);
                emailSent = true;
                console.log(`📧 Email sent successfully: ${info.messageId}`);
            } else {
                console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured. Skipping email.');
            }
        } catch (mailError) {
            console.error('❌ Email Sending Error:', mailError.message);
        }

        console.log('🚀 Sending 201 response back to app...');
        res.status(201).json({
            id: saved._id,
            status: 'pendiente',
            message: emailSent ? 'Código enviado al correo' : 'Error en servidor de correo. Usa el código de prueba.',
            devCode: vCode
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

        if (user.status !== 'activo') {
            return res.status(403).json({ error: 'Tu cuenta está pendiente de activación. Revisa tu correo.', status: 'pendiente' });
        }

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
