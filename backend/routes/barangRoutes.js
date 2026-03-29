const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getAllBarang, tambahBarang, editBarang, hapusBarang } = require('../controllers/barangController');

router.get('/', verifyToken, getAllBarang);

// post, put, delete (Superadmin)
router.post('/', verifyToken, tambahBarang);
router.put('/:id', verifyToken, editBarang);
router.delete('/:id', verifyToken, hapusBarang);

module.exports = router;