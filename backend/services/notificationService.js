const { query } = require('../config/database');
const { sendLowStockEmail } = require('./emailService');
const { sendLowStockSMS } = require('./smsService');
const { createInventoryLog } = require('./inventoryService');

// Track recently alerted items (in-memory) to avoid spamming
const recentlyAlerted = new Map(); // itemId -> timestamp
const emailDispatchCache = new Map(); // itemId:dateKey -> timestamp

const ALERT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

const getEmailSchedule = async () => {
    const result = await query(
        `SELECT key, value FROM settings WHERE key IN ('low_stock_email_time', 'low_stock_email_timezone')`
    );

    const settings = {};
    result.rows.forEach((row) => {
        settings[row.key] = row.value;
    });

    return {
        time: settings.low_stock_email_time || '09:00',
        timezone: settings.low_stock_email_timezone || 'Asia/Kolkata',
    };
};

const getZonedDateParts = (date, timezone) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });

    const parts = formatter.formatToParts(date).reduce((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = part.value;
        return acc;
    }, {});

    return {
        dateKey: `${parts.year}-${parts.month}-${parts.day}`,
        time: `${parts.hour}:${parts.minute}`,
    };
};

const shouldSendScheduledEmail = async (itemId) => {
    const schedule = await getEmailSchedule();
    const now = new Date();
    const { dateKey, time } = getZonedDateParts(now, schedule.timezone);
    const cacheKey = `${itemId}:${dateKey}`;

    if (time !== schedule.time) {
        return false;
    }

    if (emailDispatchCache.has(cacheKey)) {
        return false;
    }

    emailDispatchCache.set(cacheKey, now.getTime());
    return true;
};

/**
 * Check a single item and fire alerts if it's low stock.
 * In-app notifications remain immediate, while supplier emails respect
 * the configured daily dispatch time.
 */
const checkAndAlertLowStock = async (item, io = null, force = false) => {
    if (item.quantity >= item.threshold) return;
    if (item.status === 'not_needed') return;

    const lastAlerted = recentlyAlerted.get(item.id);
    const now = Date.now();
    if (!force && lastAlerted && now - lastAlerted < ALERT_COOLDOWN_MS) {
        return;
    }

    recentlyAlerted.set(item.id, now);

    const message = `Low Stock Alert: "${item.name}" has only ${item.quantity} unit(s) remaining (threshold: ${item.threshold}).`;

    try {
        const adminUsers = await query(
            `SELECT id FROM users WHERE role IN ('admin', 'manager')`
        );

        for (const user of adminUsers.rows) {
            const notifResult = await query(
                `INSERT INTO notifications (user_id, message, type) VALUES ($1,$2,'low_stock') RETURNING *`,
                [user.id, message]
            );

            if (io) {
                io.to(`user_${user.id}`).emit('notification', notifResult.rows[0]);
            }
        }
    } catch (err) {
        console.error('[Notification] DB error:', err.message);
    }

    let emailSent = false;
    if (await shouldSendScheduledEmail(item.id)) {
        emailSent = await sendLowStockEmail(item);
    }

    await sendLowStockSMS(item);

    if (emailSent) {
        await createInventoryLog(item.id, null, 'supplier_contacted', {
            supplier_email: item.supplier_email,
            quantity: item.quantity,
        });
    }
};

module.exports = { checkAndAlertLowStock };
