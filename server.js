const app = require('./app');
const config = require("./config")
const PORT = config.serverConfig.port

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
