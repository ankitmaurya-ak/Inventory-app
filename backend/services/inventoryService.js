const { query } = require('../config/database');

/**
 * Create an inventory log entry.
 */
const createInventoryLog = async (itemId, userId, action, metadata = {}) => {
    try {
        await query(
            `INSERT INTO inventory_logs (item_id, user_id, action, metadata) VALUES ($1,$2,$3,$4)`,
            [itemId, userId, action, JSON.stringify(metadata)]
        );
    } catch (err) {
        console.error('Failed to create log:', err.message);
    }
};

/**
 * Get all items where quantity < threshold.
 */
const getLowStockItems = async () => {
    const result = await query(`
    SELECT i.*, s.name AS supplier_name, s.email AS supplier_email
    FROM items i
    LEFT JOIN suppliers s ON i.supplier_id = s.id
    WHERE i.quantity < i.threshold AND i.status != 'not_needed'
    ORDER BY i.quantity ASC
  `);
    return result.rows;
};

module.exports = { createInventoryLog, getLowStockItems };
