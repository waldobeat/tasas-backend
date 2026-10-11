const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']); // Force Google & Cloudflare DNS

console.log('🚀 Starting Server with Custom DNS...');

// Import the actual server logic
require('./server.js');
