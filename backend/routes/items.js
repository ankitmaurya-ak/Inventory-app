const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getItems, getItem, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, getItems);
router.get('/:id', auth, getItem);

router.post('/', auth, role(['admin', 'manager']), [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
], createItem);

router.put('/:id', auth, role(['admin', 'manager']), [
    body('quantity').optional().isInt({ min: 0 }),
    body('price').optional().isFloat({ min: 0 }),
], updateItem);

router.delete('/:id', auth, role(['admin']), deleteItem);

module.exports = router;
