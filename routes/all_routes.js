const router = require('express').Router();
const crypto = require('crypto');
const { Spot, Ticket } = require('../models/data_models');
const qrcode = require('qrcode');

// --- 4. ROUTES ---

// A. ENTER PARKING (Scan QR)
router.get('/enter/:spotId', async (req, res) => {
    const { spotId } = req.params;

    try {
        // Find the spot
        const spot = await Spot.findOne({ number: spotId });
        
        if (!spot) return res.send('<h1>Error: Spot does not exist.</h1>');
        if (spot.isOccupied) {
            return res.send(`
                <div style="font-family: sans-serif; text-align: center; padding: 2rem;">
                    <h1 style="color: #dc3545;">Spot ${spotId} is already occupied!</h1>
                    <p>Did you park here? Enter your secret code below to check out.</p>
                    <div style="margin-top: 2rem;">
                        <input type="text" id="secretCode" placeholder="Enter Your Code" style="padding: 10px; font-size: 1rem; width: 200px; margin-right: 10px;">
                        <button onclick="exitParking()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer;">End Parking</button>
                    </div>
                </div>
                <script>
                    async function exitParking() {
                        const code = document.getElementById('secretCode').value;
                        if (!code) {
                            alert('Please enter your code.');
                            return;
                        }

                        // First, check the price to get the details
                        const priceCheckRes = await fetch('/api/check-price', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ code })
                        });
                        const priceData = await priceCheckRes.json();

                        if (!priceData.success) {
                            alert(priceData.message);
                            return;
                        }

                        // If price check is successful, confirm payment and exit
                        const confirmExit = confirm(\`Your total is $ \${priceData.price}. Do you want to pay and exit?\`);
                        if (confirmExit) {
                            const exitRes = await fetch('/api/exit', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ code, price: priceData.price })
                            });
                            const exitData = await exitRes.json();
                            if (exitData.success) {
                                alert('Success! You have exited the parking spot.');
                                window.location.href = '/'; // Redirect to main page
                            } else {
                                alert('Error during exit: ' + exitData.message);
                            }
                        }
                    }
                </script>
            `);
        }

        // Create a short random secret code (e.g., 8F3A2)
        const secretCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        // Create Ticket
        const newTicket = new Ticket({ spotNumber: spotId, secretCode });
        await newTicket.save();

        // Mark Spot as Occupied
        spot.isOccupied = true;
        await spot.save();

        // Redirect to the ticket page with the secret code
        res.redirect(`/ticket.html?code=${secretCode}&spot=${spotId}`);

    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).send('Server Error');
    }
});

// B. CHECK PRICE (User types code)
router.post('/check-price', async (req, res) => {
    const { code } = req.body;
    const HOURLY_RATE = 10; // $10/hour

    const ticket = await Ticket.findOne({ secretCode: code, status: 'active' });

    if (!ticket) return res.json({ success: false, message: 'Invalid or inactive code.' });

    // Calculate time diff
    const now = new Date();
    const diffHours = Math.abs(now - ticket.entryTime) / 36e5; // Convert ms to hours
    const billableHours = Math.max(1, Math.ceil(diffHours)); // Min 1 hour, round up
    const price = billableHours * HOURLY_RATE;

    res.json({
        success: true,
        spot: ticket.spotNumber,
        hours: billableHours,
        price: price
    });
});

// C. EXIT (Pay & Open Gate)
router.post('/exit', async (req, res) => {
    const { code, price } = req.body;

    const ticket = await Ticket.findOne({ secretCode: code, status: 'active' });
    if (!ticket) return res.json({ success: false, message: 'Ticket not valid.' });

    // 1. Update Ticket
    ticket.status = 'paid';
    ticket.exitTime = new Date();
    ticket.price = price;
    await ticket.save();

    // 2. Free the Spot
    await Spot.findOneAndUpdate({ number: ticket.spotNumber }, { isOccupied: false });

    res.json({ success: true, message: 'Gate Open!' });
});

// D. GET ALL SPOTS (For main dashboard)
router.get('/spots', async (req, res) => {
    try {
        const spots = await Spot.find();
        res.json(spots);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

const qrcode = require('qrcode');

// E. DYNAMIC QR CODE GENERATION
router.get('/qrcode/:spotId', async (req, res) => {
    const { spotId } = req.params;
    // You might want to get the base URL dynamically in a real app
    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const url = `${vercelUrl}/api/enter/${spotId}`;

    try {
        res.setHeader('Content-Type', 'image/png');
        qrcode.toFileStream(res, url, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Could not generate QR code');
    }
});

module.exports = router;