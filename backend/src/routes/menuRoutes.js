const express = require('express');
const router = express.Router();

const { 
    tambahMenuMaster, getMasterMenu, hapusMenuMaster, 
    reviewAkuntan, approveKasppg, 
    tambahJadwal, getJadwalMenu, hapusJadwal 
} = require('../controllers/menuController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { forbidRoles, authorizeSPPG } = require('../middlewares/roleMiddleware');

router.get('/master', verifyToken, getMasterMenu);
router.post('/master', verifyToken, forbidRoles([4]), tambahMenuMaster);
router.patch('/master/:id/review', verifyToken, forbidRoles([3]), authorizeSPPG('menu', 'id_menu'), reviewAkuntan);
router.patch('/master/:id/approve', verifyToken, forbidRoles([3, 4]), authorizeSPPG('menu', 'id_menu'), approveKasppg);
router.delete('/master/:id', verifyToken, forbidRoles([4]), authorizeSPPG('menu', 'id_menu'), hapusMenuMaster);
router.get('/jadwal', verifyToken, getJadwalMenu);
router.post('/jadwal', verifyToken, forbidRoles([4]), tambahJadwal);
router.delete('/jadwal/:id', verifyToken, forbidRoles([4]), authorizeSPPG('jadwal_menu', 'id_jadwal'), hapusJadwal);
module.exports = router;