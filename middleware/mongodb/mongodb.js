const mongoose = require('mongoose');
const config = require("../../config");

const server = config.mongodbConfig.server || 'localhost';
const port = config.mongodbConfig.port || 27017;
const database = config.mongodbConfig.database || 'defaultDB';

mongoose.connect(`mongodb://${server}:${port}/${database}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000, // 30 seconds
    socketTimeoutMS: 45000,  // 45 seconds
}).then(() => {
    console.log('Connected to MongoDB');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

module.exports = {
    mongoose,
};
