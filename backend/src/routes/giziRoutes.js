const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { forbidAkuntan, authorizeGizi, authorizeMenuParent } = require('../middlewares/roleMiddleware');
const { tambahGizi, getGizi, editGizi, hapusGizi } = require('../controllers/giziController');

// GET: Semua role (termasuk Akuntan) boleh melihat data gizi sesuai SPPG-nya
router.get('/', verifyToken, getGizi);

// POST, PATCH, DELETE: 
router.post('/', verifyToken, forbidAkuntan, authorizeMenuParent, tambahGizi);
router.patch('/:id', verifyToken, forbidAkuntan, authorizeGizi, editGizi); // MENGGUNAKAN PATCH
router.delete('/:id', verifyToken, forbidAkuntan, authorizeGizi, hapusGizi);

module.exports = router;