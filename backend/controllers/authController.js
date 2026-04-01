const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, getClient } = require('../config/database');
const { validationResult } = require('express-validator');

// Helper: generate random invite code like STORE-8F3K2L
const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'STORE-';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    return code;
};

const generateToken = (user) =>
    jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name, store_id: user.store_id, store_name: user.store_name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

// POST /api/auth/register-store
// Creates a brand new store and admin user atomically
const registerStore = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { storeName, name, email, password } = req.body;
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Generate a unique invite code
        let inviteCode;
        let codeExists = true;
        while (codeExists) {
            inviteCode = generateInviteCode();
            const check = await client.query('SELECT id FROM stores WHERE invite_code = $1', [inviteCode]);
            codeExists = check.rows.length > 0;
        }

        // Create the store
        const storeResult = await client.query(
            'INSERT INTO stores (name, invite_code) VALUES ($1, $2) RETURNING id, name, invite_code',
            [storeName, inviteCode]
        );
        const store = storeResult.rows[0];

        // Check email not already used in this store
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1 AND store_id = $2',
            [email, store.id]
        );
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Email already registered in this store.' });
        }

        // Create the admin user
        const hashed = await bcrypt.hash(password, 10);
        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role, store_id)
             VALUES ($1, $2, $3, 'admin', $4)
             RETURNING id, name, email, role, store_id, created_at`,
            [name, email, hashed, store.id]
        );
        const user = { ...userResult.rows[0], store_name: store.name };

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Store created successfully!',
            store: { id: store.id, name: store.name, invite_code: store.invite_code },
            token: generateToken(user),
            user,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[registerStore]', err);
        res.status(500).json({ error: 'Failed to create store. Please try again.' });
    } finally {
        client.release();
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        const result = await query(
            `SELECT u.*, s.name AS store_name
             FROM users u
             LEFT JOIN stores s ON s.id = u.store_id
             WHERE u.email = $1`,
            [email]
        );
        if (result.rows.length === 0)
            return res.status(401).json({ error: 'Invalid email or password.' });

        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

        const { password: _, ...safeUser } = user;
        res.json({ token: generateToken(safeUser), user: safeUser });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ error: 'Server error during login.' });
    }
};

// POST /api/auth/join-store
// Lets a user join an existing store using an invite code
const joinStore = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { inviteCode, name, email, password } = req.body;
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Find the store
        const storeResult = await client.query(
            'SELECT id, name, invite_code FROM stores WHERE invite_code = $1',
            [inviteCode.toUpperCase().trim()]
        );
        if (storeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Invalid invite code. Store not found.' });
        }
        const store = storeResult.rows[0];

        // Check email not already registered in this store
        const emailCheck = await client.query(
            'SELECT id FROM users WHERE email = $1 AND store_id = $2',
            [email, store.id]
        );
        if (emailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'This email is already registered in this store.' });
        }

        // Create the staff user
        const hashed = await bcrypt.hash(password, 10);
        const userResult = await client.query(
            `INSERT INTO users (name, email, password, role, store_id)
             VALUES ($1, $2, $3, 'viewer', $4)
             RETURNING id, name, email, role, store_id, created_at`,
            [name, email, hashed, store.id]
        );
        const user = { ...userResult.rows[0], store_name: store.name };

        await client.query('COMMIT');

        res.status(201).json({
            message: `Welcome to ${store.name}!`,
            token: generateToken(user),
            user,
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[joinStore]', err);
        res.status(500).json({ error: 'Failed to join store. Please try again.' });
    } finally {
        client.release();
    }
};

// GET /api/auth/me
const me = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.name, u.email, u.role, u.store_id, u.created_at, s.name AS store_name
             FROM users u
             LEFT JOIN stores s ON s.id = u.store_id
             WHERE u.id = $1`,
            [req.user.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
};

// GET /api/auth/store-info/:inviteCode  — preview store name before joining
const storeInfo = async (req, res) => {
    try {
        const result = await query(
            'SELECT name, invite_code FROM stores WHERE invite_code = $1',
            [req.params.inviteCode.toUpperCase().trim()]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Store not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error.' });
    }
};

module.exports = { registerStore, login, joinStore, me, storeInfo };
