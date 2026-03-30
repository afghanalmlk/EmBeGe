const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
// Panggil middleware pengaman
const { authorizeSPPG, forbidAhliGizi } = require('../middleware/roleMiddleware');
const { getInvoice, tambahInvoice, editInvoice, hapusInvoice } = require('../controllers/invoiceController');

// GET: Semua role boleh melihat Invoice (sesuai SPPG masing-masing)
router.get('/', verifyToken, getInvoice);

// POST, PUT, DELETE:
// 1. forbidAhliGizi = Memblokir Ahli Gizi (Role 3)
// 2. authorizeSPPG = Memastikan KaSPPG & Akuntan hanya memodifikasi Invoice SPPG-nya sendiri
router.post('/', verifyToken, forbidAhliGizi, tambahInvoice);
router.put('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('invoice', 'id_invoice'), editInvoice);
router.delete('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('invoice', 'id_invoice'), hapusInvoice);

module.exports = router;