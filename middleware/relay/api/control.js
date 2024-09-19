const { getRelayStatus } = require('../database');
const { setRelay } = require('../control');

// Get Relay State with search by relay, state, or both (using query parameters)
const getRelay = async (req, res, next) => {
    try {
        const { relay, state } = req.query;  // Get relay and state from the query parameters
        const query = {};

        // If relay is provided, add it to the query
        if (relay !== undefined) {
            const relayNumber = Number(relay);
            if (isNaN(relayNumber)) {
                return res.status(400).json({ status: 'failure', error: 'Invalid relay parameter.' });
            }
            query.relay = relayNumber;
        }

        // If state is provided, add it to the query
        if (state !== undefined) {
            const stateNumber = Number(state);
            if (stateNumber !== 0 && stateNumber !== 1) {
                return res.status(400).json({ status: 'failure', error: 'State must be 0 or 1.' });
            }
            query.state = stateNumber;
        }

        // Retrieve the relay states from MongoDB based on the query
        const relayStatus = await getRelayStatus(query);

        if (!relayStatus.length) {
            return res.status(404).json({ status: 'failure', message: 'No matching relay states found.' });
        }

        return res.json({
            status: 'success',
            data: relayStatus
        });
    } catch (error) {
        console.error(`Error fetching relay state: ${error.message}`);
        return res.status(500).json({ status: 'failure', error: 'Failed to fetch the relay state.' });
    }
};

// Function to handle relay control and database update
const postRelay = async (req, res) => {
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

        // Call the controlRelay function to handle GPIO control and database update
        const updatedRelayStatus = await setRelay(relayNumber, stateNumber);
        // console.log(updatedRelayStatus)
        
        return res.json({ status: 'success', relay: relayNumber, state: stateNumber, message: `Relay ${relayNumber} set to ${stateNumber}.` });
    } catch (error) {
        console.error(`Error controlling relay: ${error.message}`);
        return res.status(500).json({ status: 'failure', error: 'Failed to control the relay.' });
    }
};

module.exports = { getRelay, postRelay };
