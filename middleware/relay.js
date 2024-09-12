const Gpio = require('onoff').Gpio;
// const isLinux = process.platform === 'linux';

const isLinux = true;
const relay = async (req, res, next) => {
    try {
        const { relay, state } = req.body;
        const relayNumber = Number(relay);
        const stateNumber = Number(state);

        if (isNaN(relayNumber)) {
            return res.status(400).json({ status: 'failure', error: 'Invalid or missing relay parameter.' });
        }

        if (stateNumber !== 0 && stateNumber !== 1) {
            return res.status(400).json({ status: 'failure', error: 'State must be 0 or 1.' });
        }

        if (isLinux) {
            const gpio = new Gpio(relayNumber, 'out');
            gpio.writeSync(stateNumber);
            gpio.unexport();
            console.log(`GPIO: Relay ${relayNumber} set to ${stateNumber}`);
        } else {
            console.log(`Simulating GPIO control: Relay ${relayNumber} set to ${stateNumber}`);
        }

        return res.json({ status: 'success', relay: relayNumber, state: stateNumber, message: `Relay ${relayNumber} set to ${stateNumber}.` });
    } catch (error) {
        console.error(`Error controlling relay: ${error.message}`);
        return res.status(500).json({ status: 'failure', error: 'Failed to control the relay.' });
    }
};

module.exports = { relay };
