const express = require('express');
const cors = require('cors');
const { Expo } = require('expo-server-sdk');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS

const axios = require('axios');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { getBCVRate } = require('./services/bcv');

const expo = new Expo();
const TOKENS_FILE = path.join(__dirname, 'tokens.json');

// Memory cache for rates to detect changes
let lastKnownRates = {
    usd: { rate: null, date: null },
    eur: { rate: null, date: null }
};

const app = express();
const PORT = process.env.PORT || 8000;

// MONGOOSE SETUP
// mongoose.connect(process.env.MONGODB_URI, { family: 4 })
mongoose.connect("mongodb+srv://latasa:Latasa2026@latasa.dhmt7nn.mongodb.net/?appName=latasa", { family: 4 })
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

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

const User = mongoose.model('User', userSchema);

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

const Transaction = mongoose.model('Transaction', transactionSchema)

app.use(cors());
app.use(express.json());

// Logger Middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Email Transporter (configurar en .env)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || '').replace(/\s+/g, '') // Remove spaces from app password
    }
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Transporter Error:', error);
    } else {
        console.log('✅ Server is ready to take our messages');
    }
});

// --- AUTH API ---
app.post('/api/auth/register', async (req, res) => {
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
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Email timeout')), 10000))
                ]);
                emailSent = true;
                console.log(`📧 Email sent successfully: ${info.messageId}`);
            } else {
                console.warn('⚠️ EMAIL_USER or EMAIL_PASS not configured. Skipping email.');
            }
        } catch (mailError) {
            console.error('❌ Email Sending Error:', mailError.message);
            // Proceed anyway, user can resend later or use default code if in dev
        }


        res.status(201).json({
            id: saved._id,
            status: 'pendiente',
            message: emailSent ? 'Código enviado al correo' : 'Error en servidor de correo. Usa el código de prueba.',
            devCode: vCode // Always send for now to unblock user, can be hide later
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/verify', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
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
app.post('/api/auth/premium', async (req, res) => {
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

// --- FINANCE API ---
app.get('/api/finance/:userId', async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.params.userId }).sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finance', async (req, res) => {
    try {
        const newTrans = new Transaction(req.body);
        const saved = await newTrans.save();
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.delete('/api/finance/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
        const deleted = await Transaction.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ error: 'No encontrado' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/finance/:id', async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'ID inválido' });
        const updated = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ error: 'No encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// --- RATES & HISTORY ---
app.get('/api/rates', async (req, res) => {
    try {
        const bcvData = await getBCVRate();
        res.json({ rates: { bdv: bcvData }, timestamp: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching rates' });
    }
});

// --- HISTORY & AUTOMATION ---
const rateHistorySchema = new mongoose.Schema({
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    timestamp: { type: Date, default: Date.now },
    rates: {
        bdv: {
            usd: { rate: Number }
        }
    }
});

const RateHistory = mongoose.model('RateHistory', rateHistorySchema);

// Migrate history.json to MongoDB on startup
const migrateHistory = async () => {
    try {
        const file = 'history.json';
        if (fs.existsSync(file)) {
            const fileData = JSON.parse(fs.readFileSync(file, 'utf8'));
            for (const item of fileData) {
                const dateKey = new Date(item.timestamp).toISOString().split('T')[0];
                const exists = await RateHistory.findOne({ date: dateKey });
                if (!exists) {
                    await new RateHistory({
                        date: dateKey,
                        timestamp: item.timestamp,
                        rates: item.rates
                    }).save();
                    console.log(`✅ Migrated history for ${dateKey}`);
                }
            }
        }
    } catch (e) {
        console.error("Migration Warning:", e.message);
    }
};
migrateHistory();

// Schedule 9:00 AM Task - Caracas Time
// Cron pattern: "0 9 * * *"
const logDailyRate = async () => {
    console.log('⏰ Running Daily Rate Log Task...');
    try {
        const bcvData = await getBCVRate().catch(e => null);
        if (!bcvData || !bcvData.usd) {
            console.error('❌ Failed to fetch rates for auto-log');
            return;
        }

        let dateKey;
        if (bcvData.value_date) {
            // Parse Spanish Date: "Viernes, 06 Febrero 2026"
            const months = {
                'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
                'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
            };

            try {
                // Remove day name "Viernes, " -> "06 Febrero 2026"
                // Split by spaces
                const cleanDate = bcvData.value_date.split(',')[1]?.trim() || bcvData.value_date.trim();
                const parts = cleanDate.split(' '); // ["06", "Febrero", "2026"]

                if (parts.length >= 3) {
                    const day = parts[0].padStart(2, '0');
                    const monthName = parts[1].toLowerCase();
                    const year = parts[2];
                    const month = months[monthName];

                    if (day && month && year) {
                        dateKey = `${year}-${month}-${day}`;
                        console.log(`📅 Parsed Value Date: ${dateKey}`);
                    }
                }
            } catch (e) {
                console.error("Error parsing value_date:", e);
            }
        }

        // Fallback to Current Caracas Time if parsing fails
        if (!dateKey) {
            const now = new Date();
            const caracasDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
            dateKey = caracasDate.toISOString().split('T')[0];
            console.log(`⚠️ Using Fallback Date (Today): ${dateKey}`);
        }

        // Upsert rate for the SPECIFIC Value Date
        const result = await RateHistory.findOneAndUpdate(
            { date: dateKey },
            {
                date: dateKey,
                timestamp: new Date(), // Verification timestamp
                rates: {
                    bdv: {
                        usd: { rate: bcvData.usd.rate }
                    }
                }
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Auto-logged rate for ${dateKey}: ${bcvData.usd.rate}`);
    } catch (err) {
        console.error('❌ Auto-log Error:', err);
    }
};

cron.schedule('0 9 * * *', logDailyRate, {
    scheduled: true,
    timezone: "America/Caracas"
});

// Check if we missed the scan on startup (e.g., server was off at 9 AM)
const checkMissedSchedule = async () => {
    const now = new Date();
    const caracasDate = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
    const hours = caracasDate.getHours();

    // If it's past 9 AM, check if we have today's log
    if (hours >= 9) {
        const dateKey = caracasDate.toISOString().split('T')[0];
        const exists = await RateHistory.findOne({ date: dateKey });
        if (!exists) {
            console.log(`⚠️ Missed 9 AM scan for ${dateKey}. Running catch-up now...`);
            await logDailyRate();
        } else {
            console.log(`info: Daily log for ${dateKey} already exists.`);
        }
    }
};

// Run checks after DB connection
mongoose.connection.once('open', () => {
    migrateHistory().then(() => {
        checkMissedSchedule();
    });
});

app.get('/api/history', async (req, res) => {
    try {
        // Return sorted by date ascending
        const history = await RateHistory.find().sort({ date: 1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching history' });
    }
});

app.post('/api/pushtoken', (req, res) => {
    const { token } = req.body;
    if (!token || !Expo.isExpoPushToken(token)) return res.status(400).send({ error: 'Token inválido' });
    // Token Logic...
    res.send({ success: true });
});

app.use(express.static('public'));

// 404 Catch-all for API
app.use('/api', (req, res) => {
    console.warn(`⚠️ 404 NOT FOUND: ${req.url}`);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Monitoring (Interval instead of broken cron)
setInterval(async () => {
    const now = new Date();
    const caracas = new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
    const hours = caracas.getHours();

    if (hours < 9 || hours >= 19) return;

    try {
        const bcvData = await getBCVRate().catch(e => { console.error("BCV Error:", e.message); return null; });
        if (!bcvData) return;

        // 1. Check USD
        if (bcvData.usd) {
            const currentUsdRate = bcvData.usd.rate;
            const currentUsdDate = bcvData.value_date || '';

            if (lastKnownRates.usd.rate !== currentUsdRate || lastKnownRates.usd.date !== currentUsdDate) {
                console.log(`🔔 Cambio detectado en USD: ${lastKnownRates.usd.rate} -> ${currentUsdRate}`);
                lastKnownRates.usd = { rate: currentUsdRate, date: currentUsdDate };
                notifyUsers('USD', currentUsdRate, currentUsdDate);
            }
        }
    } catch (e) { console.error("Monitor error", e.message); }
}, 60 * 60 * 1000); // Once per hour

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
