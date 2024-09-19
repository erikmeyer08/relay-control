const express = require('express');
const router = express.Router();
const { platformCheck } = require('../middleware/until/platformcheck');
const { authenticate } = require('../middleware/authentication/authenticate');
const { getRelay, postRelay } = require('../middleware/relay/api/control');
const { addSchedule, updateSchedule, deleteSchedule, getSchedule } = require('../middleware/relay/api/schedule');

router.get('/control', authenticate, getRelay);

router.post('/control', platformCheck, authenticate, postRelay);

router.get('/schedule', authenticate, getSchedule);

router.post('/schedule', authenticate, addSchedule);

router.put('/schedule', authenticate, updateSchedule);

router.delete('/schedule', authenticate, deleteSchedule);

module.exports = router;
