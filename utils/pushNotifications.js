const axios = require('axios');

// Configuración de OneSignal
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
    console.error("❌ ERROR: OneSignal credentials missing. Check your .env file.");
}

// OneSignal maneja el registro automáticamente en el SDK, no necesitamos guardar tokens locales
function getSavedTokens() { return []; }
function saveToken(token) { return true; }

// Send Notification using OneSignal REST API
async function broadcastNotification(title, body, data = {}) {
    console.log("OneSignal: Enviando notificación a todos los usuarios...");
    console.log("OneSignal: App ID:", ONESIGNAL_APP_ID ? "Configurado ✅" : "FALTA ❌");
    console.log("OneSignal: API Key:", ONESIGNAL_REST_API_KEY ? "Configurada ✅" : "FALTA ❌");
    if (ONESIGNAL_REST_API_KEY) {
        console.log("OneSignal: API Key prefix:", ONESIGNAL_REST_API_KEY.substring(0, 10) + "...");
    }

    try {
        const response = await axios.post('https://onesignal.com/api/v1/notifications', {
            app_id: ONESIGNAL_APP_ID,
            included_segments: ["All"],
            contents: { "en": body, "es": body },
            headings: { "en": title, "es": title },
            data: data
        }, {
            headers: {
                'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`OneSignal: Broadcast enviado. ID: ${response.data.id}`);
    } catch (error) {
        console.error("Error en OneSignal Broadcast:", error.response ? error.response.data : error.message);
    }
}

module.exports = {
    saveToken,
    broadcastNotification
};
