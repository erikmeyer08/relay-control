const express = require('express');
const app = express();
const relayRoutes = require('./routes/relay');

app.use(express.json());

app.use('/api/relay', relayRoutes);

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ status: 'failure', error: 'Invalid JSON payload' });
    }
    next();
});

app.use((req, res, next) => {
    res.status(404).json({ status: 'failure', error: 'Not found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack); // Log error stack for debugging
    res.status(500).json({ status: 'failure', error: 'Internal Server Error' });
});

module.exports = app;
