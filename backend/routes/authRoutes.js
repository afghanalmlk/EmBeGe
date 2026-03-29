const express = require('express');
const router = express.Router();

// Panggil fungsi register DAN login dari controller
const { register, login } = require('../controllers/authController');

router.post('/register', register);

router.post('/login', login);

module.exports = router;