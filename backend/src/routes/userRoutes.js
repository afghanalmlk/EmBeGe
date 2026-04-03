// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getUsers, addUser, editUser, hapusUser } = require('../controllers/userController');

router.get('/', verifyToken, getUsers);
router.post('/', verifyToken, addUser);
router.put('/:id', verifyToken, editUser);
router.delete('/:id', verifyToken, hapusUser);

module.exports = router;