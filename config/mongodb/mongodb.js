const dotenv = require('dotenv');
const envPath = `./${process.env.NODE_ENV || 'production'}.env`;
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error(`Error loading ${envPath}:`, result.error);
}

module.exports = {
    server: process.env.MONGODB_SERVER,
    port: process.env.MONGODB_PORT,
    database: process.env.MONGODB_DATABASE,
};
