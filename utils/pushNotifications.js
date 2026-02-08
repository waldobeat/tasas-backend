const axios = require('axios');

// Configuración de OneSignal
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || "0898149e-1a1e-44cf-9807-5b0088bfe32c";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY || "os_v2_app_bcmbjhq2dzcm7gahlmairp7dfqnshu3jk3nequeoyxsjzgqeawk3pegvuop2fzetst5p4ymiorhxwfwsdoohzfuwar4ae5ai7kjffdi";

// OneSignal maneja el registro automáticamente en el SDK, no necesitamos guardar tokens locales
function getSavedTokens() { return []; }
function saveToken(token) { return true; }

// Send Notification using OneSignal REST API
async function broadcastNotification(title, body, data = {}) {
    console.log("OneSignal: Enviando notificación a todos los usuarios...");

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
