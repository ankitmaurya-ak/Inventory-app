const { query } = require('../config/database');
const { sendLowStockEmail } = require('./emailService');
const { sendLowStockSMS } = require('./smsService');
const { createInventoryLog } = require('./inventoryService');

// Track recently alerted items (in-memory) to avoid spamming
const recentlyAlerted = new Map(); // itemId → timestamp

const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Check a single item and fire alerts/emails if it's low stock.
 * Called from both the API (on create/update) and the background worker.
 */
const checkAndAlertLowStock = async (item, io = null, force = false) => {
    if (item.quantity >= item.threshold) return; // not low stock
    if (item.status === 'not_needed') return;

    const lastAlerted = recentlyAlerted.get(item.id);
    const now = Date.now();
    // Only apply cooldown if force is false
    if (!force && lastAlerted && now - lastAlerted < ALERT_COOLDOWN_MS) {
        return; // cooldown active
    }

    recentlyAlerted.set(item.id, now);

    const message = `⚠️ Low Stock Alert: "${item.name}" has only ${item.quantity} unit(s) remaining (threshold: ${item.threshold}).`;

    // 1. Store notification for all admins and managers
    try {
        const adminUsers = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'manager')`
        );
        for (const user of adminUsers.rows) {
            const notifResult = await query(
                `INSERT INTO notifications (user_id, message, type) VALUES ($1,$2,'low_stock') RETURNING *`,
                [user.id, message]
            );
            // 2. Send real-time socket notification
            if (io) {
                io.to(`user_${user.id}`).emit('notification', notifResult.rows[0]);
            }
        }
    } catch (err) {
        console.error('[Notification] DB error:', err.message);
    }

    // 3. Send supplier email
    const emailSent = await sendLowStockEmail(item);

    // 4. Send Owner SMS
    const smsSent = await sendLowStockSMS(item);

    // 5. Log the contact events
    if (emailSent) {
        await createInventoryLog(item.id, null, 'supplier_contacted', {
            supplier_email: item.supplier_email,
            quantity: item.quantity,
        });
    }
};

module.exports = { checkAndAlertLowStock };
