const express = require('express');
const router = express.Router();

const { getInvoice, tambahInvoice, editInvoice, hapusInvoice, updateStatusInvoice } = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidRoles } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getInvoice);
router.post('/', verifyToken, forbidRoles([3]), tambahInvoice);
router.patch('/:id', verifyToken, forbidRoles([3]), authorizeSPPG('invoice', 'id_invoice'), editInvoice);
router.delete('/:id', verifyToken, forbidRoles([3]), authorizeSPPG('invoice', 'id_invoice'), hapusInvoice);
router.patch('/:id/status', verifyToken, authorizeSPPG('invoice', 'id_invoice'), updateStatusInvoice);
module.exports = router;
