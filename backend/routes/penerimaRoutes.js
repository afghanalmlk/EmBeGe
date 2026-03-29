const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima } = require('../controllers/penerimaController');

router.get('/', verifyToken, getAllPenerima);
// post, put, delete: Superadmin, (KaSPPG dalam SPPG sama)
router.post('/', verifyToken, tambahPenerima);
router.put('/:id', verifyToken, editPenerima);
router.delete('/:id', verifyToken, hapusPenerima);

module.exports = router;