const express = require('express');
const router = express.Router();

// 1. Memanggil satpam keamanan kita
const { verifyToken } = require('../middleware/authMiddleware');

// 2. Memanggil fungsi dari koki (controller) user
const { getUsers, addUser, editUser, hapusUser } = require('../controllers/userController');

// 3. Membuat jalur untuk melihat daftar pegawai (dilindungi satpam)
router.get('/', verifyToken, getUsers);
// 4. Membuat jalur untuk menambah pegawai baru (dilindungi satpam)
router.post('/', verifyToken, addUser);
// put (semua user (username, pass, email, dll)), 
// delete belum (superadmin: semua user, KaSPPG: user dalam SPPG sama)
router.put('/:id', verifyToken, editUser);
router.delete('/:id', verifyToken, hapusUser);

module.exports = router;