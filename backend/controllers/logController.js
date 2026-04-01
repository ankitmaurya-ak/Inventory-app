const { query } = require('../config/database');

// GET /api/logs
const getLogs = async (req, res) => {
    const { item_id, user_id, action, page = 1, limit = 30 } = req.query;
    const offset = (page - 1) * limit;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (item_id) { conditions.push(`l.item_id = $${idx++}`); params.push(item_id); }
    if (user_id) { conditions.push(`l.user_id = $${idx++}`); params.push(user_id); }
    if (action) { conditions.push(`l.action = $${idx++}`); params.push(action); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    try {
        const countRes = await query(`SELECT COUNT(*) FROM inventory_logs l ${where}`, params);
        params.push(limit, offset);
        const result = await query(
            `SELECT l.*, i.name AS item_name, u.name AS user_name
       FROM inventory_logs l
       LEFT JOIN items i ON l.item_id = i.id
       LEFT JOIN users u ON l.user_id = u.id
       ${where}
       ORDER BY l.timestamp DESC
       LIMIT $${idx++} OFFSET $${idx}`,
            params
        );
        res.json({ logs: result.rows, total: parseInt(countRes.rows[0].count) });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs.' });
    }
};

module.exports = { getLogs };
