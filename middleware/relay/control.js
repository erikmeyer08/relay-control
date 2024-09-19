const Gpio = require('onoff').Gpio;
const { upsertRelayStatus } = require('./database');

// Function to control relay and update the database
const setRelay = async (relayNumber, stateNumber) => {
    if (isNaN(relayNumber)) {
        throw new Error('Invalid or missing relay parameter.');
    }

    if (stateNumber !== 0 && stateNumber !== 1) {
        throw new Error('State must be 0 or 1.');
    }

    // Handle the GPIO control
    if (true) {
        const gpio = new Gpio(relayNumber, 'out');
        gpio.writeSync(stateNumber);
        gpio.unexport();
        console.log(`GPIO: Relay ${relayNumber} set to ${stateNumber}`);
    } else {
        console.log(`Simulating GPIO control: Relay ${relayNumber} set to ${stateNumber}`);
    }

    // Update or insert the relay state in MongoDB
    const updatedRelayStatus = await upsertRelayStatus(relayNumber, stateNumber);
    return updatedRelayStatus;
};

module.exports = { setRelay };
