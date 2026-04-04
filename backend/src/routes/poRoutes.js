const express = require('express');
const router = express.Router();

const { getPO, tambahPO, revisiPO, updateStatusPO } = require('../controllers/poController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidRoles } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getPO);
router.post('/', verifyToken, forbidRoles([2, 3]), tambahPO);
router.patch('/:id', verifyToken, forbidRoles([2, 3]), authorizeSPPG('po', 'id_po'), revisiPO);
router.patch('/:id/status', verifyToken, forbidRoles([3, 4]), authorizeSPPG('po', 'id_po'), updateStatusPO);

module.exports = router;