const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
// Panggil middleware otorisasi perlindungan ganda
const { authorizeSPPG, forbidGiziAndAkuntan } = require('../middleware/roleMiddleware');
const { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima } = require('../controllers/penerimaController');

// GET: Semua role (termasuk Gizi & Akuntan) boleh melihat data sesuai SPPG-nya
router.get('/', verifyToken, getAllPenerima);

// POST, PUT, DELETE:
// 1. forbidGiziAndAkuntan = Blokir Ahli Gizi & Akuntan
// 2. authorizeSPPG = Pastikan KaSPPG hanya mengedit/menghapus penerima milik SPPG-nya sendiri
router.post('/', verifyToken, forbidGiziAndAkuntan, tambahPenerima);
router.put('/:id', verifyToken, forbidGiziAndAkuntan, authorizeSPPG('penerima_manfaat', 'id_penerima'), editPenerima);
router.delete('/:id', verifyToken, forbidGiziAndAkuntan, authorizeSPPG('penerima_manfaat', 'id_penerima'), hapusPenerima);

module.exports = router;