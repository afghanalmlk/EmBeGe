const express = require('express');
const router = express.Router();

// Path middleware disesuaikan menjadi '../middlewares/...'
const { getAllBarang, tambahBarang, editBarang, hapusBarang } = require('../controllers/barangController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { allowRoles } = require('../middlewares/roleMiddleware'); 

router.get('/', verifyToken, getAllBarang);
router.post('/', verifyToken, allowRoles([1]), tambahBarang); // Menggantikan requireSuperadmin
router.patch('/:id', verifyToken, allowRoles([1]), editBarang);
router.delete('/:id', verifyToken, allowRoles([1]), hapusBarang);
module.exports = router;