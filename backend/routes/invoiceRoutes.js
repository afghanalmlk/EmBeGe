const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware');
const { getInvoice, tambahInvoice, editInvoice, hapusInvoice } = require('../controllers/invoiceController');

router.get('/', verifyToken, getInvoice);
router.post('/', verifyToken, tambahInvoice);
// put, delete (Superadmin, Akuntan, KaSPPG dalam SPPG sama)
router.put('/:id', verifyToken, editInvoice);
router.delete('/:id', verifyToken, hapusInvoice);

module.exports = router;