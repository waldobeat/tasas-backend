const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']); // Forcing Google DNS to bypass CANTV SRV blocks

const connectDB = require('./config/db');
const mongoose = require('mongoose');

async function wipeDatabase() {
    console.log('⏳ Intentando conectar a MongoDB Atlas evadiendo bloqueo de DNS local...');

    try {
        await connectDB();
        console.log('✅ Conexión establecida.');

        console.log('🗑️ Borrando todos los usuarios...');
        const usersResult = await mongoose.connection.collection('users').deleteMany({});
        console.log(`✅ ${usersResult.deletedCount} usuarios borrados.`);

        console.log('🗑️ Borrando todos los comentarios y opiniones...');
        const commentsResult = await mongoose.connection.collection('comments').deleteMany({});
        console.log(`✅ ${commentsResult.deletedCount} comentarios borrados.`);

        try {
            const opinionsResult = await mongoose.connection.collection('opinions').deleteMany({});
            console.log(`✅ ${opinionsResult.deletedCount} opiniones borradas.`);
        } catch (e) { }

        console.log('🎉 BASE DE DATOS TOTALMENTE LIMPIA.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error conectando:', error.message);
        process.exit(1);
    }
}

wipeDatabase();
