const express = require('express');
const app = express();
const mongoose = require('./middleware/mongodb/mongodb') // MongoDB connection logic
const relayRoutes = require('./routes/relay');

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api/relay', relayRoutes);

// Error handling middleware for JSON syntax errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ status: 'failure', error: 'Invalid JSON payload' });
    }
    next();
});

// 404 handler for missing routes
app.use((req, res, next) => {
    res.status(404).json({ status: 'failure', error: 'Not found' });
});

// Generic error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ status: 'failure', error: 'Internal Server Error' });
});

// Restore relay states on startup
require('./middleware/relay/startup');

// Export the Express app
module.exports = app;
