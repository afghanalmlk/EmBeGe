const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { getUsers, addUser, editUser, hapusUser } = require('../controllers/userController');

// Melihat daftar pegawai
router.get('/', verifyToken, getUsers);

// Menambah pegawai baru
router.post('/', verifyToken, addUser);

// Mengedit data diri (Password, email, telp) atau Superadmin edit siapa saja
router.patch('/:id', verifyToken, editUser); // MENGGUNAKAN PATCH

// Menghapus pegawai
router.delete('/:id', verifyToken, hapusUser);

module.exports = router;