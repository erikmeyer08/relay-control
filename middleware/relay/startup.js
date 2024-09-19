const { getRelayStatus } = require('./database');  // Import your getRelayStates logic
const { setRelay } = require('./control');  // Import your setRelay logic

// Function to restore relay states on startup
async function restoreRelayStates() {
    try {
        // Fetch all relay states from the database
        const relayStates = await getRelayStatus({});

        if (relayStates && relayStates.length > 0) {
            for (const { relay, state } of relayStates) {
                // Call the setRelay function to set the relay state
                console.log(`Restoring relay ${relay} to state ${state}`);
                await setRelay(relay, state);  // This will restore the relay's GPIO state
                console.log(`Relay ${relay} set to state ${state}`);
            }
        } else {
            console.log('No relay states found in the database.');
        }
    } catch (error) {
        console.error(`Error restoring relay states: ${error.message}`);
    }
}

// Call the function to restore relay states on startup
restoreRelayStates();
