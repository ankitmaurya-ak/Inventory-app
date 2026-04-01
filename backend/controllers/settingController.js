const { query } = require('../config/database');

// GET /api/settings
const getSettings = async (req, res) => {
    try {
        const result = await query('SELECT key, value FROM settings');
        const settings = {};
        result.rows.forEach(r => { settings[r.key] = r.value; });

        // Don't send the raw password back to UI unless we want to, just send a flag
        if (settings.email_pass) {
            settings.email_pass = '********';
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch settings.' });
    }
};

// PUT /api/settings
const updateSettings = async (req, res) => {
    const { email_user, email_pass } = req.body;
    try {
        if (email_user !== undefined) {
            await query('UPDATE settings SET value = $1 WHERE key = $2', [email_user, 'email_user']);
        }
        if (email_pass && email_pass !== '********') {
            await query('UPDATE settings SET value = $1 WHERE key = $2', [email_pass, 'email_pass']);
        }
        res.json({ message: 'Settings updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
};

module.exports = { getSettings, updateSettings };
