require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');



const { Spot } = require('./models/data_models');
const allRoutes = require('./routes/all_routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public', { index: 'main.html' })); 

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.get('/ticket.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ticket.html'));
});

app.use('/api', allRoutes);


const MONGO_URI = process.env.MONGO_URI 

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to DB'))
  .catch(err => console.error('DB Error:', err));



async function initSpots() {
    const spots = ['A1', 'A2', 'A3', 'B1', 'B2'];
    for (const num of spots) {
        const exists = await Spot.findOne({ number: num });
        if (!exists) {
            await new Spot({ number: num }).save();
            console.log(`Created Spot ${num}`);
        }
    }
}
initSpots();




app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));