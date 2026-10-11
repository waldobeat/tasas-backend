const cron = require('node-cron');
const Transaction = require('../models/Transaction');
const { broadcastNotification } = require('../utils/pushNotifications');
const axios = require('axios');

// OneSignal Config (Redundant if using broadcastNotification util, but we need targeted sending)
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

const sendTargetedNotification = async (userId, title, body, data = {}) => {
    try {
        if (!userId) return;

        console.log(`🔔 Sending targeted notification to User ${userId}`);

        await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: ONESIGNAL_APP_ID,
            include_aliases: { "external_id": [userId.toString()] }, // v5+ API uses aliases/external_id, or use include_external_user_ids for legacy
            target_channel: "push",
            contents: { "en": body, "es": body },
            headings: { "en": title, "es": title },
            data: data
        }, {
            headers: {
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        // Fallback for legacy API or errors
        try {
            await axios.post('https://onesignal.com/api/v1/notifications', {
                app_id: ONESIGNAL_APP_ID,
                include_external_user_ids: [userId.toString()], // Legacy
                contents: { "en": body, "es": body },
                headings: { "en": title, "es": title },
                data: data
            }, {
                headers: {
                    'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });
        } catch (e) {
            console.error(`❌ Error sending notification to ${userId}:`, e.response ? e.response.data : e.message);
        }
    }
};

const checkDueInstallments = async () => {
    console.log("⏰ Checking for due debt installments...");
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Find debts with pending installments due TODAY
        const debts = await Transaction.find({
            type: 'debt',
            completed: false,
            'installments.status': 'pending',
            'installments.dueDate': { $gte: today, $lt: tomorrow }
        });

        console.log(`Found ${debts.length} debts with installments due today.`);

        for (const debt of debts) {
            // Find the specific installment
            const installment = debt.installments.find(i =>
                i.status === 'pending' &&
                new Date(i.dueDate) >= today &&
                new Date(i.dueDate) < tomorrow
            );

            if (installment) {
                const amount = installment.amount.toFixed(2);
                const provider = debt.provider || debt.category || "Deuda";

                await sendTargetedNotification(
                    debt.userId,
                    "📅 ¡Cuota Vence Hoy!",
                    `Tu cuota de ${provider} por $${amount} vence hoy. ¡No olvides registrarla!`,
                    { type: 'debt_reminder', transactionId: debt._id }
                );
            }
        }
    } catch (error) {
        console.error("❌ Error refreshing debt rates:", error);
    }
};

const setupDebtScheduler = () => {
    // Run every day at 9:00 AM Venezuela time
    cron.schedule('0 9 * * *', async () => {
        await checkDueInstallments();
    }, {
        scheduled: true,
        timezone: "America/Caracas"
    });

    // Also run a check on startup (dev only, or remove for production to avoid spam on restart)
    // if (process.env.NODE_ENV === 'development') checkDueInstallments();
};

module.exports = { setupDebtScheduler, checkDueInstallments };
