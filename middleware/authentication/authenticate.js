const config = require('../../config');
const key = config.apiConfig.key

const authenticate = (req, res, next) => {
    const suppliedKey = req.header('x-api-key');
    
    if (!suppliedKey) {
        return res.status(401).json({ error: 'API key is missing' });
    }

    if (suppliedKey.trim() !== key.trim()) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
};

module.exports = { authenticate };
