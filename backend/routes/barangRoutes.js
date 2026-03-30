const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { requireSuperadmin } = require('../middleware/roleMiddleware'); // Import middleware baru
const { getAllBarang, tambahBarang, editBarang, hapusBarang } = require('../controllers/barangController');

// Semua user (yang sudah login) boleh melihat daftar barang
router.get('/', verifyToken, getAllBarang);

// HANYA Superadmin yang boleh Tambah, Edit, Hapus
router.post('/', verifyToken, requireSuperadmin, tambahBarang);
router.put('/:id', verifyToken, requireSuperadmin, editBarang);
router.delete('/:id', verifyToken, requireSuperadmin, hapusBarang);

module.exports = router;