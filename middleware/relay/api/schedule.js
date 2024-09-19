const { getRelayStatus, upsertRelayStatus } = require('../database');
const { setRelay } = require('../control');

// Get all schedules
const getSchedule = async (req, res) => {
    try {
        const schedules = await getRelayStatus({});
        res.json({ status: 'success', data: schedules });
    } catch (error) {
        res.status(500).json({ status: 'failure', error: error.message });
    }
};

// Add a new schedule
const addSchedule = async (req, res) => {
    try {
        const { relay, state, day, time } = req.body;
        const newSchedule = { relay, state, day, time };

        // Fetch current schedules for the relay
        const relayStatus = await getRelayStatus({ relay });
        let updatedSchedules = [];

        if (relayStatus.length > 0) {
            updatedSchedules = relayStatus[0].schedule ? JSON.parse(relayStatus[0].schedule) : [];
        }

        // Check if a schedule with the same relay, state, and time already exists
        const existingSchedule = updatedSchedules.find(
            s => s.relay === relay && s.state === state && s.time === time
        );

        if (existingSchedule) {
            // Merge the days of the new schedule with the existing schedule's days
            existingSchedule.day = [...new Set([...existingSchedule.day, ...day])];
        } else {
            // Add the new schedule if it doesn't exist
            updatedSchedules.push(newSchedule);
        }

        // Update the relay status with the updated schedule list
        await upsertRelayStatus(relay, state, updatedSchedules);

        res.json({ status: 'success', data: updatedSchedules });
    } catch (error) {
        res.status(500).json({ status: 'failure', error: error.message });
    }
};

// Update an existing schedule
const updateSchedule = async (req, res) => {
    try {
        const { relay, schedule } = req.body;  // Extract 'relay' and 'schedule' (which contains day, state, time)
        const { state, day, time } = schedule;  // Extract state, day, and time from schedule

        // Fetch the current relay status document
        const relayStatus = await getRelayStatus({ relay });

        // Check if the relayStatus exists
        if (!relayStatus.length) {
            return res.status(404).json({ status: 'failure', error: 'Relay not found' });
        }

        // Parse the existing schedule
        let updatedSchedules = relayStatus[0].schedule ? JSON.parse(relayStatus[0].schedule) : [];

        // Ensure `state` is compared as a string
        const normalizedState = String(state);  // Convert `state` to string for comparison

        // Find and update only the 'day' field for the specific schedule
        let scheduleFound = false;
        updatedSchedules = updatedSchedules.map(existingSchedule => {
            // Compare `state` and `time` as strings
            if (String(existingSchedule.state) === normalizedState && existingSchedule.time === time) {
                scheduleFound = true;
                // Update only the 'day' field, keep the rest the same
                return { ...existingSchedule, day };
            }
            return existingSchedule;
        });

        if (!scheduleFound) {
            return res.status(404).json({ status: 'failure', error: 'Schedule not found' });
        }

        // Update the relay status with the updated schedules array (stringified)
        await upsertRelayStatus(relay, relayStatus[0].state, updatedSchedules);

        res.json({ status: 'success', data: updatedSchedules });
    } catch (error) {
        res.status(500).json({ status: 'failure', error: error.message });
    }
};

// Delete a schedule
const deleteSchedule = async (req, res) => {
    try {
        const { relay, state, day, time } = req.body;

        // Fetch current schedules for the relay
        const relayStatus = await getRelayStatus({ relay });
        let updatedSchedules = [];

        if (relayStatus.length > 0) {
            updatedSchedules = relayStatus[0].schedule ? JSON.parse(relayStatus[0].schedule) : [];
        }

        // Find and remove the specific schedule
        updatedSchedules = updatedSchedules.filter(schedule => 
            !(schedule.relay === relay && schedule.state === state && JSON.stringify(schedule.day) === JSON.stringify(day) && schedule.time === time)
        );

        // Update the relay status with the new schedule list
        await upsertRelayStatus(relay, state, updatedSchedules);

        res.json({ status: 'success', data: updatedSchedules });
    } catch (error) {
        res.status(500).json({ status: 'failure', error: error.message });
    }
};

module.exports = {
    getSchedule,
    addSchedule,
    updateSchedule,
    deleteSchedule
};