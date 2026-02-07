const { Expo } = require('expo-server-sdk');
const fs = require('fs');
const path = require('path');

const expo = new Expo();
const TOKENS_FILE = path.join(__dirname, '../tokens.json');

// Generic Notify (Broadcast or Targeted)
// data: { title, body, data, targetUserId (optional) }
const notifyUsers = async (data) => {
    try {
        if (!fs.existsSync(TOKENS_FILE)) return;

        const tokensData = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        // tokensData is now { "TOKEN": { userId: "ID", ... } } OR old format { "TOKEN": true }

        const messages = [];

        for (const token in tokensData) {
            if (!Expo.isExpoPushToken(token)) continue;

            const tokenInfo = tokensData[token];
            let shouldSend = true;

            // Logic for Targeted Notifications
            if (data.targetUserId) {
                // Check if this token belongs to the target user
                // Handle both old format (boolean) and new format (object)
                const tokenOwner = (typeof tokenInfo === 'object') ? tokenInfo.userId : null;
                if (tokenOwner !== data.targetUserId) {
                    shouldSend = false;
                }
            }

            if (shouldSend) {
                messages.push({
                    to: token,
                    sound: 'default',
                    title: data.title || '📢 Notificación La Tasa',
                    body: data.body || `Nueva actualización disponible`,
                    data: data.data || {}
                });
            }
        }

        if (messages.length === 0) return;

        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            try {
                await expo.sendPushNotificationsAsync(chunk);
            } catch (error) {
                console.error('Error sending chunks', error);
            }
        }
        console.log(`📢 Sent ${messages.length} notifications ${data.targetUserId ? '(Targeted)' : '(Broadcast)'}`);
    } catch (error) {
        console.error('Error in notifyUsers:', error);
    }
};

module.exports = { notifyUsers };
