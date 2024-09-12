const app = require('./app');
const portConfig = require("./config")
const PORT = portConfig.port

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
