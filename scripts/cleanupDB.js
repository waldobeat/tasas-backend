const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google Public DNS
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Comment = require('../models/Comment');

async function cleanupDatabase() {
    try {
        console.log('🔌 Conectando a la base de datos...');
        await mongoose.connect("mongodb+srv://latasa:Latasa2026@latasa.dhmt7nn.mongodb.net/?appName=latasa", {
            family: 4
        });
        console.log('✅ Conectado a MongoDB.');

        console.log('🗑️  Eliminando todos los usuarios...');
        const userResult = await User.deleteMany({});
        console.log(`✅ Usuarios eliminados: ${userResult.deletedCount}`);

        console.log('🗑️  Eliminando todos los comentarios...');
        // Handle case if Comment model doesn't exist or isn't populated
        if (Comment) {
            const commentResult = await Comment.deleteMany({});
            console.log(`✅ Comentarios eliminados: ${commentResult.deletedCount}`);
        }

        console.log('🚀 Limpieza completada exitosamente.');
    } catch (error) {
        console.error('❌ Error durante la limpieza:', error);
    } finally {
        console.log('🔌 Desconectando...');
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanupDatabase();
