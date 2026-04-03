const express = require('express');
const router = express.Router();

// Path middleware disesuaikan menjadi '../middlewares/...'
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireSuperadmin } = require('../middlewares/roleMiddleware'); 
const { getAllBarang, tambahBarang, editBarang, hapusBarang } = require('../controllers/barangController');

// Semua user (yang sudah login) boleh melihat daftar barang
router.get('/', verifyToken, getAllBarang);

// HANYA Superadmin yang boleh Tambah, Edit, Hapus
router.post('/', verifyToken, requireSuperadmin, tambahBarang);
router.patch('/:id', verifyToken, requireSuperadmin, editBarang); // MENGGUNAKAN PATCH
router.delete('/:id', verifyToken, requireSuperadmin, hapusBarang);

module.exports = router;