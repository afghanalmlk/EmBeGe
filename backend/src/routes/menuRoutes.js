const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { tambahMenu, getMenu, editMenu, hapusMenu } = require('../controllers/menuController');
const { forbidRoles, authorizeSPPG } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getMenu);
// Memblokir Role 4 (Akuntan)
router.post('/', verifyToken, forbidRoles([4]), tambahMenu);
router.patch('/:id', verifyToken, forbidRoles([4]), authorizeSPPG('menu', 'id_menu'), editMenu);
router.delete('/:id', verifyToken, forbidRoles([4]), authorizeSPPG('menu', 'id_menu'), hapusMenu);
module.exports = router;