const express = require('express');
const router = express.Router();

const { tambahGizi, getGizi, editGizi, hapusGizi } = require('../controllers/giziController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { forbidRoles, authorizeGizi, authorizeMenuParent } = require('../middlewares/roleMiddleware');

router.get('/', verifyToken, getGizi);
router.post('/', verifyToken, forbidRoles([4]), authorizeMenuParent, tambahGizi);
router.patch('/:id', verifyToken, forbidRoles([4]), authorizeGizi, editGizi);
router.delete('/:id', verifyToken, forbidRoles([4]), authorizeGizi, hapusGizi);
module.exports = router;