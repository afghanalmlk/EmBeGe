const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidGiziAndAkuntan } = require('../middlewares/roleMiddleware');
const { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima } = require('../controllers/penerimaController');

// GET: Semua role (termasuk Gizi & Akuntan) boleh melihat data sesuai SPPG-nya
router.get('/', verifyToken, getAllPenerima);

// POST, PATCH, DELETE:
router.post('/', verifyToken, forbidGiziAndAkuntan, tambahPenerima);
router.patch('/:id', verifyToken, forbidGiziAndAkuntan, authorizeSPPG('penerima_manfaat', 'id_penerima'), editPenerima); // MENGGUNAKAN PATCH
router.delete('/:id', verifyToken, forbidGiziAndAkuntan, authorizeSPPG('penerima_manfaat', 'id_penerima'), hapusPenerima);

module.exports = router;