const { Expo } = require('expo-server-sdk');
const fs = require('fs');
const path = require('path');

const expo = new Expo();
const TOKENS_FILE = path.join(__dirname, '../tokens.json');

/**
 * Función que usa el cron para enviar a TODOS
 */
const broadcastNotification = async (title, body, extraData = {}) => {
    return await notifyUsers({ title, body, data: extraData });
};

/**
 * Lógica principal de envío
 */
const notifyUsers = async (data) => {
    try {
        if (!fs.existsSync(TOKENS_FILE)) return;

        const tokensData = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
        const messages = [];
        const invalidTokens = []; // Para limpieza

        for (const token in tokensData) {
            if (!Expo.isExpoPushToken(token)) {
                console.warn(`Token inválido omitido: ${token}`);
                continue;
            }

            const tokenInfo = tokensData[token];
            let shouldSend = true;

            // Lógica para notificaciones dirigidas (Targeted)
            if (data.targetUserId) {
                const tokenOwner = (typeof tokenInfo === 'object') ? tokenInfo.userId : null;
                if (tokenOwner !== data.targetUserId) {
                    shouldSend = false;
                }
            }

            if (shouldSend) {
                messages.push({
                    to: token,
                    sound: 'default',
                    priority: 'high', // Asegura que llegue rápido
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
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                // NOTA: Aquí podrías revisar los tickets para ver si hay tokens expirados
            } catch (error) {
                console.error('Error enviando paquetes de notificaciones:', error);
            }
        }
        
        console.log(`📢 Enviadas ${messages.length} notificaciones ${data.targetUserId ? '(Dirigidas)' : '(Masivas)'}`);
    } catch (error) {
        console.error('Error en notifyUsers:', error);
    }
};

// Exportamos ambas para tener flexibilidad
module.exports = { notifyUsers, broadcastNotification };
