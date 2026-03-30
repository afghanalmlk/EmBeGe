const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
// Panggil middleware otorisasi
const { authorizeSPPG, forbidAhliGizi } = require('../middleware/roleMiddleware');
const { getPO, tambahPO, updateStatusPO, hapusPO } = require('../controllers/poController');

// GET: Semua role (termasuk Ahli Gizi) boleh melihat
router.get('/', verifyToken, getPO);

// POST, PUT, DELETE: Blokir Ahli Gizi & Pastikan kepemilikan data (SPPG)
router.post('/', verifyToken, forbidAhliGizi, tambahPO);
router.put('/:id/status', verifyToken, forbidAhliGizi, authorizeSPPG('po', 'id_po'), updateStatusPO);
router.delete('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('po', 'id_po'), hapusPO);

module.exports = router;