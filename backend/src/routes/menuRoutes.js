const express = require('express');
const router = express.Router();

const { 
    tambahMenuMaster, getMasterMenu, reviewAkuntan, 
    updateStatusMenu, tambahJadwal, getJadwalMenu, revisiMenuMaster
} = require('../controllers/menuController');

const { verifyToken } = require('../middlewares/authMiddleware');
const { forbidRoles, authorizeSPPG } = require('../middlewares/roleMiddleware');

router.get('/master', verifyToken, getMasterMenu);
router.post('/master', verifyToken, forbidRoles([2, 4]), tambahMenuMaster);
router.patch('/master/:id', verifyToken, forbidRoles([2, 4]), authorizeSPPG('menu', 'id_menu'), revisiMenuMaster);
router.patch('/master/:id/review', verifyToken, forbidRoles([2, 3]), authorizeSPPG('menu', 'id_menu'), reviewAkuntan);
router.patch('/master/:id/status', verifyToken, forbidRoles([3, 4]), authorizeSPPG('menu', 'id_menu'), updateStatusMenu);
router.get('/jadwal', verifyToken, getJadwalMenu);
router.post('/jadwal', verifyToken, forbidRoles([2, 4]), tambahJadwal);

module.exports = router;