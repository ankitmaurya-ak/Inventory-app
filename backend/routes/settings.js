const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Only Admins can modify settings
router.get('/', auth, role(['admin']), getSettings);
router.put('/', auth, role(['admin']), updateSettings);

module.exports = router;
