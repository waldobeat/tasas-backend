require('dotenv').config();
const { broadcastNotification } = require('./utils/pushNotifications');

async function test() {
    console.log("🚀 Iniciando simulación de notificación...");
    const title = "🔔 ¡Prueba de La Tasa!";
    const body = "Esta es una notificación de prueba desde tu servidor local.";
    const data = { test: true };

    await broadcastNotification(title, body, data);
    console.log("✅ Simulación completada.");
}

test();
