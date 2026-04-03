const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { forbidAkuntan, authorizeSPPG } = require('../middlewares/roleMiddleware');
const { tambahMenu, getMenu, editMenu, hapusMenu } = require('../controllers/menuController');

// GET: Semua role bisa melihat menu sesuai SPPG-nya
router.get('/', verifyToken, getMenu);

// POST, PATCH, DELETE: 
router.post('/', verifyToken, forbidAkuntan, tambahMenu);
router.patch('/:id', verifyToken, forbidAkuntan, authorizeSPPG('menu', 'id_menu'), editMenu); // MENGGUNAKAN PATCH
router.delete('/:id', verifyToken, forbidAkuntan, authorizeSPPG('menu', 'id_menu'), hapusMenu);

module.exports = router;