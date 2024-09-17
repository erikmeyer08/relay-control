const { getRelayStates } = require('./database');  // Import your getRelayStates logic
const { postRelay } = require('./relay');  // Import your postRelay logic

// Function to restore relay states on startup
async function restoreRelayStates() {
    try {
        // Fetch all relay states from the database
        const relayStates = await getRelayStates({});

        if (relayStates && relayStates.length > 0) {
            for (const { relay, state } of relayStates) {
                // Prepare a mock req and res to simulate API call
                const req = {
                    body: { relay, state }
                };

                // Mock res object with a simplified structure
                const res = {
                    status: (code) => ({
                        json: (data) => console.log(`Response (status ${code}):`, data)
                    })
                };

                // Call the postRelay function to set the relay state
                console.log(`Restoring relay ${relay} to state ${state}`);
                await postRelay(req, res);  // This will restore the relay's GPIO state
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
