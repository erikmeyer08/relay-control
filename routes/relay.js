const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authentication/authenticate');
const { getRelay, postRelay } = require('../middleware/relay/relay');

router.get('/', authenticate, getRelay);

router.post('/', authenticate, postRelay);

module.exports = router;
