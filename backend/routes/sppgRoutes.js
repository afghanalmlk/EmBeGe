const express = require('express');
const router = express.Router();
const { getSppg } = require('../controllers/sppgController');

router.get('/', getSppg);

module.exports = router;