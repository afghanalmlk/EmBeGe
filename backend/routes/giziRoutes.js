const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
// Panggil middleware otorisasi yang sudah dibuat sebelumnya
const { forbidAkuntan, authorizeGizi, authorizeMenuParent } = require('../middleware/roleMiddleware');
const { tambahGizi, getGizi, editGizi, hapusGizi } = require('../controllers/giziController');

// GET: Semua role (termasuk Akuntan) boleh melihat data gizi sesuai SPPG-nya
router.get('/', verifyToken, getGizi);

// POST, PUT, DELETE: 
// 1. forbidAkuntan = Memblokir Role 4 (Akuntan)
// 2. authorizeMenuParent = Memastikan id_menu di body adalah milik SPPG user
// 3. authorizeGizi = Memastikan id_gizi yang diakses adalah milik SPPG user
router.post('/', verifyToken, forbidAkuntan, authorizeMenuParent, tambahGizi);
router.put('/:id', verifyToken, forbidAkuntan, authorizeGizi, editGizi);
router.delete('/:id', verifyToken, forbidAkuntan, authorizeGizi, hapusGizi);

module.exports = router;