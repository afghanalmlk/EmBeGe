const express = require('express');
const router = express.Router();

const { getAllPenerima, tambahPenerima, editPenerima, hapusPenerima } = require('../controllers/penerimaController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidRoles } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getAllPenerima);
router.post('/', verifyToken, forbidRoles([3, 4]), tambahPenerima);
router.patch('/:id', verifyToken, forbidRoles([3, 4]), authorizeSPPG('penerima_manfaat', 'id_penerima'), editPenerima);
router.delete('/:id', verifyToken, forbidRoles([3, 4]), authorizeSPPG('penerima_manfaat', 'id_penerima'), hapusPenerima);
module.exports = router;