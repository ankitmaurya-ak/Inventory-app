const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { registerStore, login, joinStore, me, storeInfo } = require('../controllers/authController');
const auth = require('../middleware/auth');

// POST /api/auth/register-store — create a new store + admin user
router.post('/register-store', [
    body('storeName').trim().notEmpty().withMessage('Store name is required'),
    body('name').trim().notEmpty().withMessage('Your name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], registerStore);

// POST /api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
], login);

// POST /api/auth/join-store — join an existing store with invite code
router.post('/join-store', [
    body('inviteCode').trim().notEmpty().withMessage('Invite code is required'),
    body('name').trim().notEmpty().withMessage('Your name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], joinStore);

// GET /api/auth/me — get current user with store info
router.get('/me', auth, me);

// GET /api/auth/store-info/:inviteCode — preview store name before joining
router.get('/store-info/:inviteCode', storeInfo);

module.exports = router;
