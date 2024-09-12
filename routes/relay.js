const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const { relay } = require('../middleware/relay');

router.post('/', authenticate, relay);

module.exports = router;
