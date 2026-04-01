const { query } = require('../config/database');

const saveSetting = async (key, value) => {
    await query(
        `INSERT INTO settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, value]
    );
};

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
    const { email_user, email_pass, low_stock_email_time, low_stock_email_timezone } = req.body;
    try {
        if (email_user !== undefined) {
            await saveSetting('email_user', email_user);
        }
        if (email_pass && email_pass !== '********') {
            await saveSetting('email_pass', email_pass);
        }
        if (low_stock_email_time !== undefined) {
            await saveSetting('low_stock_email_time', low_stock_email_time);
        }
        if (low_stock_email_timezone !== undefined) {
            await saveSetting('low_stock_email_timezone', low_stock_email_timezone);
        }
        res.json({ message: 'Settings updated successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update settings.' });
    }
};

module.exports = { getSettings, updateSettings };
