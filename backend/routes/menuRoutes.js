const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
// Panggil middleware otorisasi
const { forbidAkuntan, authorizeSPPG } = require('../middleware/roleMiddleware');
const { tambahMenu, getMenu, editMenu, hapusMenu } = require('../controllers/menuController');

// GET: Semua role bisa melihat menu sesuai SPPG-nya
router.get('/', verifyToken, getMenu);

// POST, PUT, DELETE: 
// - forbidAkuntan memastikan Role 4 tidak bisa mengakses ini
// - authorizeSPPG memastikan user hanya bisa mengubah/menghapus menu milik SPPG-nya sendiri
router.post('/', verifyToken, forbidAkuntan, tambahMenu);
router.put('/:id', verifyToken, forbidAkuntan, authorizeSPPG('menu', 'id_menu'), editMenu);
router.delete('/:id', verifyToken, forbidAkuntan, authorizeSPPG('menu', 'id_menu'), hapusMenu);

module.exports = router;