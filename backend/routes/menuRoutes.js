const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');

const { tambahMenu, getMenu, editMenu, hapusMenu } = require('../controllers/menuController');

router.post('/', verifyToken, tambahMenu);
router.get('/', verifyToken, getMenu);
// put, delete: Superadmin, (ahli gizi, KaSPPG dalam SPPG sama)
router.put('/:id', verifyToken, editMenu);
router.delete('/:id', verifyToken, hapusMenu);

module.exports = router;