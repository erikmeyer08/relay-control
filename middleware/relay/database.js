const RelayState = require('../../model/relay/schema');

// Function to fetch relay states based on query (relay and/or state)
const getRelayStatus = async (query) => {
    try {
        return await RelayState.find(query);
    } catch (error) {
        throw new Error(`Failed to fetch relay states: ${error.message}`);
    }
};

// Function to update or insert a relay state in MongoDB
const upsertRelayStatus = async (relayNumber, stateNumber, schedule = null) => {
    try {
        // Fetch the existing relay state
        const existingRelayState = await RelayState.findOne({ relay: relayNumber });

        // If no new schedule is provided, retain the existing schedule
        const scheduleString = schedule ? JSON.stringify(schedule) : existingRelayState ? existingRelayState.schedule : '[]';

        return await RelayState.findOneAndUpdate(
            { relay: relayNumber },  // Find by 'relay' field
            { state: stateNumber, schedule: scheduleString, timestamp: Date.now() },  // Update the state, schedule, and timestamp
            { upsert: true, new: true }  // Create the document if it doesn't exist
        );
    } catch (error) {
        throw new Error(`Failed to update relay state: ${error.message}`);
    }
};

module.exports = {
    getRelayStatus,
    upsertRelayStatus
};
