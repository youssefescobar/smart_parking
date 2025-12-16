const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const os = require('os');

// --- DYNAMIC SERVER URL ---
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost'; // Fallback
}

// CONFIGURATION
const SERVER_URL = `http://${getLocalIpAddress()}:3000`; 
const SPOTS = ['A1', 'A2', 'A3', 'B1', 'B2'];
const OUTPUT_DIR = './qr_codes';

// Ensure directory exists
if (!fs.existsSync(OUTPUT_DIR)){
    fs.mkdirSync(OUTPUT_DIR);
}

const generate = async () => {
    console.log(`Generating QR codes pointing to: ${SERVER_URL}`);
    
    for (const spot of SPOTS) {
        // The URL the user visits to START parking
        const url = `${SERVER_URL}/enter/${spot}`;
        
        const filePath = path.join(OUTPUT_DIR, `${spot}.png`);
        
        await QRCode.toFile(filePath, url, {
            color: {
                dark: '#000000',  // Black dots
                light: '#FFFFFF' // White background
            },
            width: 300
        });

        console.log(`✅ Generated: ${spot}.png`);
    }
};

generate();