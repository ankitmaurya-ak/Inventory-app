const { query } = require('../config/database');

// GET /api/notifications?page=1&limit=20
const getNotifications = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const countRes = await query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1', [req.user.id]
        );
        const result = await query(
            `SELECT * FROM notifications WHERE user_id = $1
       ORDER BY timestamp DESC LIMIT $2 OFFSET $3`,
            [req.user.id, limit, offset]
        );
        const unreadCount = await query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false', [req.user.id]
        );
        res.json({
            notifications: result.rows,
            total: parseInt(countRes.rows[0].count),
            unread: parseInt(unreadCount.rows[0].count),
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch notifications.' });
    }
};

// PUT /api/notifications/:id/read
const markRead = async (req, res) => {
    try {
        await query(
            'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        res.json({ message: 'Marked as read.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notification.' });
    }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
    try {
        await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [req.user.id]);
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update notifications.' });
    }
};

module.exports = { getNotifications, markRead, markAllRead };
