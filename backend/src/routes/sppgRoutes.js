const express = require('express');
const router = express.Router();

const { getSppg } = require('../controllers/sppgController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, getSppg);
module.exports = router;