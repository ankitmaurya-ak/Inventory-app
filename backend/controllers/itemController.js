const { query } = require('../config/database');
const { validationResult } = require('express-validator');
const { createInventoryLog } = require('../services/inventoryService');
const { checkAndAlertLowStock } = require('../services/notificationService');

// GET /api/items
const getItems = async (req, res) => {
    try {
        const { search, category, status, supplier_id, low_stock, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;
        let conditions = [];
        let params = [];
        let idx = 1;

        if (search) {
            conditions.push(`(i.name ILIKE $${idx} OR i.category ILIKE $${idx} OR i.location ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (category) { conditions.push(`i.category = $${idx++}`); params.push(category); }
        if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
        if (supplier_id) { conditions.push(`i.supplier_id = $${idx++}`); params.push(supplier_id); }
        if (low_stock === 'true') conditions.push(`i.quantity < i.threshold`);

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await query(
            `SELECT COUNT(*) FROM items i ${where}`, params
        );
        const total = parseInt(countResult.rows[0].count);

        params.push(limit, offset);
        const result = await query(
            `SELECT i.*, s.name AS supplier_name, s.email AS supplier_email
       FROM items i
       LEFT JOIN suppliers s ON i.supplier_id = s.id
       ${where}
       ORDER BY i.updated_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
            params
        );

        res.json({ items: result.rows, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch items.' });
    }
};

// GET /api/items/:id
const getItem = async (req, res) => {
    try {
        const result = await query(
            `SELECT i.*, s.name AS supplier_name, s.email AS supplier_email
       FROM items i LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = $1`, [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch item.' });
    }
};

// POST /api/items
const createItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, quantity, price, threshold = 10, supplier_id, location, status = 'available' } = req.body;
    try {
        const result = await query(
            `INSERT INTO items (name, category, quantity, price, threshold, supplier_id, location, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [name, category, quantity, price, threshold, supplier_id || null, location, status]
        );
        const item = result.rows[0];
        await createInventoryLog(item.id, req.user.id, 'item_created', { name, quantity });
        // Check if new item is already low stock
        await checkAndAlertLowStock(item, req.app.get('io'));
        res.status(201).json(item);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create item.' });
    }
};

// PUT /api/items/:id
const updateItem = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, category, quantity, price, threshold, supplier_id, location, status } = req.body;
    try {
        const old = await query('SELECT * FROM items WHERE id = $1', [req.params.id]);
        if (old.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });

        const result = await query(
            `UPDATE items SET name=$1, category=$2, quantity=$3, price=$4, threshold=$5,
       supplier_id=$6, location=$7, status=$8 WHERE id=$9 RETURNING *`,
            [name ?? old.rows[0].name, category ?? old.rows[0].category,
            quantity ?? old.rows[0].quantity, price ?? old.rows[0].price,
            threshold ?? old.rows[0].threshold, supplier_id ?? old.rows[0].supplier_id,
            location ?? old.rows[0].location, status ?? old.rows[0].status, req.params.id]
        );

        const updated = result.rows[0];
        await createInventoryLog(updated.id, req.user.id, 'item_updated', { old: old.rows[0], new: updated });
        if (quantity !== undefined && quantity !== old.rows[0].quantity) {
            await createInventoryLog(updated.id, req.user.id, 'quantity_changed',
                { old_quantity: old.rows[0].quantity, new_quantity: quantity });
        }
        await checkAndAlertLowStock(updated, req.app.get('io'));
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update item.' });
    }
};

// DELETE /api/items/:id
const deleteItem = async (req, res) => {
    try {
        const result = await query('DELETE FROM items WHERE id = $1 RETURNING *', [req.params.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found.' });
        res.json({ message: 'Item deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete item.' });
    }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem };
