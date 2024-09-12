const apiConfig= require('../config/index')

const authenticate = (req, res, next) => {
    const suppliedKey = req.header('x-api-key');
    const key = apiConfig.key;

    if (!suppliedKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }

    if (suppliedKey !== key) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
};

module.exports = { authenticate };
