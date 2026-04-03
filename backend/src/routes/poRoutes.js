const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidAhliGizi } = require('../middlewares/roleMiddleware');
const { getPO, tambahPO, updateStatusPO, hapusPO } = require('../controllers/poController');

router.get('/', verifyToken, getPO);

router.post('/', verifyToken, forbidAhliGizi, tambahPO);
router.patch('/:id/status', verifyToken, forbidAhliGizi, authorizeSPPG('po', 'id_po'), updateStatusPO); // PUT -> PATCH
router.delete('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('po', 'id_po'), hapusPO);

module.exports = router;