const express = require('express');
const router = express.Router();
const { getStats, getTrend, getScanStatus, triggerScanNow } = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

router.get('/stats', auth, getStats);
router.get('/trend', auth, getTrend);
router.get('/scan-status', auth, getScanStatus);
router.post('/scan-now', auth, triggerScanNow);

module.exports = router;
