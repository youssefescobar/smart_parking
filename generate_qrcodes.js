const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const spots = ['A1', 'A2', 'A3', 'B1', 'B2'];
const baseUrl = 'http://localhost:3000';
const qrCodeDir = path.join(__dirname, 'qr_codes');

// Create the qr_codes directory if it doesn't exist
if (!fs.existsSync(qrCodeDir)) {
    fs.mkdirSync(qrCodeDir);
}

async function generateQrCodes() {
    console.log('Starting QR code generation...');
    for (const spot of spots) {
        const url = `${baseUrl}/api/qrcode/${spot}`;
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch QR code for spot ${spot}: ${response.statusText}`);
            }
            const dest = fs.createWriteStream(path.join(qrCodeDir, `${spot}.png`));
            response.body.pipe(dest);
            console.log(`Successfully generated QR code for spot ${spot}`);
        } catch (error) {
            console.error(error);
        }
    }
    console.log('QR code generation complete.');
}

generateQrCodes();
