const express = require('express');
const router = express.Router();

const { getPO, tambahPO, updateStatusPO, hapusPO } = require('../controllers/poController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidRoles } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getPO);
router.post('/', verifyToken, forbidRoles([3]), tambahPO);



router.patch('/:id/status', verifyToken, forbidRoles([3]), authorizeSPPG('po', 'id_po'), updateStatusPO);
router.delete('/:id', verifyToken, forbidRoles([3]), authorizeSPPG('po', 'id_po'), hapusPO);
module.exports = router;