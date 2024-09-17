const Gpio = require('onoff').Gpio;
const isLinux = process.platform === 'linux';
const checkPlatform = require('../platform/check');
const { getRelayStates, upsertRelayState } = require('./database');

// Get Relay State with search by relay, state, or both
const getRelay = async (req, res, next) => {
    try {
        const { relay, state } = req.body;  // Get relay and state from the request body
        const query = {};

        // Add relay to query if provided
        if (relay !== undefined) {
            const relayNumber = Number(relay);
            if (isNaN(relayNumber)) {
                return res.status(400).json({ status: 'failure', error: 'Invalid relay parameter.' });
            }
            query.relay = relayNumber;
        }

        // Add state to query if provided
        if (state !== undefined) {
            const stateNumber = Number(state);
            if (stateNumber !== 0 && stateNumber !== 1) {
                return res.status(400).json({ status: 'failure', error: 'State must be 0 or 1.' });
            }
            query.state = stateNumber;
        }

        // Retrieve the relay states from MongoDB based on the query
        const relayStates = await getRelayStates(query);

        if (!relayStates.length) {
            return res.status(404).json({ status: 'failure', message: 'No matching relay states found.' });
        }

        return res.json({
            status: 'success',
            data: relayStates
        });
    } catch (error) {
        console.error(`Error fetching relay state: ${error.message}`);
        return res.status(500).json({ status: 'failure', error: 'Failed to fetch the relay state.' });
    }
};

// Post Relay State
const postRelay = async (req, res, next) => {
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

        // Handle the GPIO control
        if (checkPlatform()) {
            const gpio = new Gpio(relayNumber, 'out');
            gpio.writeSync(stateNumber);
            gpio.unexport();
            console.log(`GPIO: Relay ${relayNumber} set to ${stateNumber}`);
        } else {
            console.log(`Simulating GPIO control: Relay ${relayNumber} set to ${stateNumber}`);
        }

        // Update or insert the relay state in MongoDB
        const updatedRelayState = await upsertRelayState(relayNumber, stateNumber);
        
        return res.json({ status: 'success', relay: relayNumber, state: stateNumber, message: `Relay ${relayNumber} set to ${stateNumber}.` });
    } catch (error) {
        console.error(`Error controlling relay: ${error.message}`);
        return res.status(500).json({ status: 'failure', error: 'Failed to control the relay.' });
    }
};

module.exports = { getRelay, postRelay };
