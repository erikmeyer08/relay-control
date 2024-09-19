// const cron = require('node-cron');
// const { getRelayStatus, upsertRelayStatus } = require('./database');
// const { setRelay } = require('./control');

// // Function to set up cron jobs based on schedules
// const setupCronJobs = async () => {
//     try {
//         const relayStatuses = await getRelayStatus({});
//         console.log('Relay statuses fetched:', relayStatuses);

//         relayStatuses.forEach(relayStatus => {
//             const { relay, schedule } = relayStatus;
//             console.log(`Processing schedule for relay ${relay}: ${schedule}`);

//             if (schedule && schedule.length > 0) {
//                 const schedules = JSON.parse(schedule);

//                 schedules.forEach(({ relay, state, time }) => {
//                     console.log(time);
//                     const relayNumber = Number(relay);
//                     const stateNumber = Number(state);

//                     // Parse the time to a Date object
//                     const dateTime = new Date(time);

//                     // Get local minutes, hours, etc.
//                     const cronPattern = `${dateTime.getMinutes()} ${dateTime.getHours()} ${dateTime.getDate()} ${dateTime.getMonth() + 1} *`;

//                     console.log('cronPattern:', cronPattern);
//                     console.log(`Scheduling cron job for relay ${relayNumber} at ${cronPattern} (time: ${time})`);

//                     // Schedule the job using the local time-based cron pattern
//                     cron.schedule(cronPattern, () => {
//                         setRelay(relayNumber, stateNumber);
//                         console.log(`Relay ${relayNumber} set to state ${stateNumber} at ${time}`);
//                     });
//                 });
//             } else {
//                 console.log(`No schedules found for relay ${relay}`);
//             }
//         });
//     } catch (error) {
//         console.error('Error setting up cron jobs:', error.message);
//     }
// };

// cron.schedule('* * * * *', () => {
//     setupCronJobs();  // Refresh the cron jobs every minute
// });

// // Call the function to set up cron jobs
// setupCronJobs();

const cron = require('node-cron');
const { getRelayStatus, upsertRelayStatus } = require('./database');
const { setRelay } = require('./control');

// Function to set up cron jobs based on schedules
const setupCronJobs = async () => {
    try {
        const relayStatuses = await getRelayStatus({});
        console.log('Relay statuses fetched:', relayStatuses);

        relayStatuses.forEach(relayStatus => {
            const { relay, schedule } = relayStatus;
            console.log(`Processing schedule for relay ${relay}: ${schedule}`);

            if (schedule && schedule.length > 0) {
                const schedules = JSON.parse(schedule);

                schedules.forEach(({ relay, state, day, time }) => {
                    const relayNumber = Number(relay);
                    const stateNumber = Number(state);

                    // Check if a day of the week is provided
                    if (day && day.length > 0) {
                        // Parse the time
                        const dateTime = new Date(time);
                        const cronTime = `${dateTime.getMinutes()} ${dateTime.getHours()} * * ${day.join(',')}`;

                        console.log('cronPattern (for days of week):', cronTime);
                        console.log(`Scheduling cron job for relay ${relayNumber} at ${cronTime} (time: ${time})`);

                        // Schedule the job for specific days of the week
                        const job = cron.schedule(cronTime, () => {
                            setRelay(relayNumber, stateNumber);
                            console.log(`Relay ${relayNumber} set to state ${stateNumber} at ${time}`);
                        });

                        currentCronJobs.push(job);
                    } else {
                        console.log(`No specific days of the week for relay ${relay}`);
                    }
                });
            } else {
                console.log(`No schedules found for relay ${relay}`);
            }
        });
    } catch (error) {
        console.error('Error setting up cron jobs:', error.message);
    }
};

// Call the function to set up cron jobs
setupCronJobs();
