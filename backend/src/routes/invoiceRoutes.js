const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidAhliGizi } = require('../middlewares/roleMiddleware');
const { getInvoice, tambahInvoice, editInvoice, hapusInvoice, updateStatusInvoice } = require('../controllers/invoiceController');

router.get('/', verifyToken, getInvoice);

router.post('/', verifyToken, forbidAhliGizi, tambahInvoice);
router.patch('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('invoice', 'id_invoice'), editInvoice); // PUT -> PATCH
router.delete('/:id', verifyToken, forbidAhliGizi, authorizeSPPG('invoice', 'id_invoice'), hapusInvoice);
router.patch('/:id/status', verifyToken, authorizeSPPG('invoice', 'id_invoice'), updateStatusInvoice); // PUT -> PATCH

module.exports = router;