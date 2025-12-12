const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const studentRoutes = require('./routes/studentRoutes');
const ziadostRoutes = require('./routes/ziadostRoutes');
const odvolanieRoutes = require('./routes/odvolanieRoutes');
const hodnoteniaRoutes = require('./routes/hodnoteniaRoutes');
const notifikaciaRoutes = require('./routes/notifikaciaRoutes');
const administratorRoutes = require('./routes/administratorRoutes');

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/ziadosti', ziadostRoutes);
app.use('/api/odvolania', odvolanieRoutes);
app.use('/api/hodnotenia', hodnoteniaRoutes);
app.use('/api/notifikacie', notifikaciaRoutes);
app.use('/api/admin', administratorRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server beží' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Niečo sa pokazilo!', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server beží na porte ${PORT}`);
  console.log(`📡 API dostupné na http://localhost:${PORT}/api`);
});

module.exports = app;
