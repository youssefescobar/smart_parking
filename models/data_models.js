const mongoose = require('mongoose');

// --- 2. DATA MODELS ---

// Schema for the physical parking spot
const SpotSchema = new mongoose.Schema({
    number: { type: String, unique: true, required: true },
    isOccupied: { type: Boolean, default: false }, // Means "Ticket Active"
    isSensorDetecting: { type: Boolean, default: false } // NEW: Means "Car Physically There"
});

// Schema for the parking session (Ticket)
const TicketSchema = new mongoose.Schema({
    spotNumber: String,
    secretCode: String,
    entryTime: { type: Date, default: Date.now },
    exitTime: Date,
    price: Number,
    status: { type: String, default: 'active' } // 'active' or 'paid'
});

const Spot = mongoose.model('Spot', SpotSchema);
const Ticket = mongoose.model('Ticket', TicketSchema);

module.exports = { Spot, Ticket };