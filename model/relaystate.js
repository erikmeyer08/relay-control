const mongoose = require('mongoose');

const relayStateSchema = new mongoose.Schema({
    relay: {
        type: Number,
        required: true
    },
    state: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

const RelayState = mongoose.model('RelayState', relayStateSchema);
module.exports = RelayState;
