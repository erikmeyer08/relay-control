const RelayState = require('../../model/relaystate');

// Function to fetch relay states based on query (relay and/or state)
const getRelayStates = async (query) => {
    try {
        return await RelayState.find(query);
    } catch (error) {
        throw new Error(`Failed to fetch relay states: ${error.message}`);
    }
};

// Function to update or insert a relay state in MongoDB
const upsertRelayState = async (relayNumber, stateNumber) => {
    try {
        return await RelayState.findOneAndUpdate(
            { relay: relayNumber },  // Find by 'relay' field
            { state: stateNumber, timestamp: Date.now() },  // Update the state and timestamp
            { upsert: true, new: true }  // Create the document if it doesn't exist
        );
    } catch (error) {
        throw new Error(`Failed to update relay state: ${error.message}`);
    }
};

module.exports = {
    getRelayStates,
    upsertRelayState
};
