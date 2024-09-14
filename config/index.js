const api = require('./api/api');
const mongodb = require('./mongodb/mongodb');
const server = require('./server/server');

module.exports = {
    apiConfig: api,
    mongodbConfig: mongodb,
    serverConfig: server,
};