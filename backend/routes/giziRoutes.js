const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { tambahGizi, getGizi, editGizi, hapusGizi } = require('../controllers/giziController');

router.post('/', verifyToken, tambahGizi);

// get, put, delete (Superadmin, Ahli Gizi, KaSPPG dalam SPPG sama)
router.get('/', verifyToken, getGizi);
router.put('/:id', verifyToken, editGizi);
router.delete('/:id', verifyToken, hapusGizi);

module.exports = router;