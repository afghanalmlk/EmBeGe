const express = require('express');
const router = express.Router();

const { getInvoice, tambahInvoice, revisiInvoice, updateStatusInvoice } = require('../controllers/invoiceController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { authorizeSPPG, forbidRoles } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getInvoice);
router.post('/', verifyToken, forbidRoles([2, 3]), tambahInvoice);
router.patch('/:id', verifyToken, forbidRoles([2, 3]), authorizeSPPG('invoice', 'id_invoice'), revisiInvoice);
router.patch('/:id/status', verifyToken, forbidRoles([3, 4]), authorizeSPPG('invoice', 'id_invoice'), updateStatusInvoice);

module.exports = router;