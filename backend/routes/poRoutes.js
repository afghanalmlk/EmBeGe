const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getPO, tambahPO, updateStatusPO , hapusPO} = require('../controllers/poController');

router.get('/', verifyToken, getPO);
router.post('/', verifyToken, tambahPO);
router.put('/:id/status', verifyToken, updateStatusPO);
// delete (Superadmin, Akuntan, KaSPPG dalam SPPG sama)
// po bisa di delete jika status masih pending
router.delete('/:id', verifyToken, hapusPO);

module.exports = router;