const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = require('./config/db');
const mongoose = require('mongoose');

async function wipeTransactions() {
    console.log('⏳ Conectando a MongoDB Atlas...');
    try {
        await connectDB();
        console.log('✅ Conexión establecida.');

        const result = await mongoose.connection.collection('transactions').deleteMany({});
        console.log(`🗑️ ${result.deletedCount} transacciones financieras eliminadas.`);
        console.log('🎉 Registros financieros limpios.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

wipeTransactions();
