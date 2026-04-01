const { query } = require('../config/database');
const { validationResult } = require('express-validator');

const getSuppliers = async (req, res) => {
    try {
        const { search } = req.query;
        let sql = `SELECT s.*, COUNT(i.id) AS item_count
               FROM suppliers s
               LEFT JOIN items i ON i.supplier_id = s.id`;
        const params = [];
        if (search) {
            sql += ` WHERE s.name ILIKE $1 OR s.email ILIKE $1`;
            params.push(`%${search}%`);
        }
        sql += ' GROUP BY s.id ORDER BY s.name';
        const result = await query(sql, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch suppliers.' });
    }
};

const getSupplier = async (req, res) => {
    try {
        const result = await query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found.' });
        const items = await query('SELECT * FROM items WHERE supplier_id = $1', [req.params.id]);
        res.json({ ...result.rows[0], items: items.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch supplier.' });
    }
};

const createSupplier = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email, phone, address } = req.body;
    try {
        const result = await query(
            'INSERT INTO suppliers (name, email, phone, address) VALUES ($1,$2,$3,$4) RETURNING *',
            [name, email, phone, address]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Email already exists.' });
        res.status(500).json({ error: 'Failed to create supplier.' });
    }
};

const updateSupplier = async (req, res) => {
    const { name, email, phone, address } = req.body;
    try {
        const result = await query(
            `UPDATE suppliers SET name=COALESCE($1,name), email=COALESCE($2,email),
       phone=COALESCE($3,phone), address=COALESCE($4,address)
       WHERE id=$5 RETURNING *`,
            [name, email, phone, address, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update supplier.' });
    }
};

const deleteSupplier = async (req, res) => {
    try {
        const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found.' });
        res.json({ message: 'Supplier deleted.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete supplier.' });
    }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier };
