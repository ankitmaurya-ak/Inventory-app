const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, getSuppliers);
router.get('/:id', auth, getSupplier);
router.post('/', auth, role(['admin', 'manager']), [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
], createSupplier);
router.put('/:id', auth, role(['admin', 'manager']), updateSupplier);
router.delete('/:id', auth, role(['admin']), deleteSupplier);

module.exports = router;
