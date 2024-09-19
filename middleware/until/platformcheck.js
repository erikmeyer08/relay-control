// platformCheck.js
const isLinux = process.platform === 'linux';

const platformCheck = (req, res, next) => {
    if (!isLinux) {
        // return res.status(400).json({ status: 'failure', error: 'This service is only supported on Linux.' });
    }
    next();
};

module.exports = { platformCheck };
