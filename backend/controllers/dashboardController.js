const { query } = require('../config/database');
const { inventoryQueue } = require('../workers/queue');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
  try {
    const [totals, categoryData, recentLogs] = await Promise.all([
      query(`
        SELECT
          COUNT(*)                                              AS total_items,
          SUM(quantity * price)                                 AS total_value,
          COUNT(*) FILTER (WHERE status = 'available')          AS available_items,
          COUNT(*) FILTER (WHERE status = 'out_of_stock')       AS out_of_stock,
          COUNT(*) FILTER (WHERE status = 'needed')             AS needed_items,
          COUNT(*) FILTER (WHERE status = 'not_needed')         AS not_needed_items,
          COUNT(*) FILTER (WHERE quantity < threshold AND quantity > 0) AS low_stock_items
        FROM items
      `),
      query(`
        SELECT category, COUNT(*) AS count, SUM(quantity) AS total_qty, SUM(quantity * price) AS total_value
        FROM items
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
        LIMIT 10
      `),
      query(`
        SELECT l.action, l.timestamp, i.name AS item_name, u.name AS user_name
        FROM inventory_logs l
        LEFT JOIN items i ON l.item_id = i.id
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.timestamp DESC LIMIT 10
      `),
    ]);

    // Status distribution for pie chart
    const statusDist = await query(`
      SELECT status, COUNT(*) AS count FROM items GROUP BY status
    `);

    res.json({
      stats: totals.rows[0],
      categoryBreakdown: categoryData.rows,
      recentActivity: recentLogs.rows,
      statusDistribution: statusDist.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

// GET /api/dashboard/trend — last 30 days inventory value
const getTrend = async (req, res) => {
  try {
    const result = await query(`
      SELECT
        DATE(timestamp) AS date,
        COUNT(*) AS changes
      FROM inventory_logs
      WHERE timestamp > NOW() - INTERVAL '30 days'
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trend data.' });
  }
};
// GET /api/dashboard/scan-status
const getScanStatus = async (req, res) => {
  try {
    const repeatableJobs = await inventoryQueue.getRepeatableJobs();
    const activeCount = await inventoryQueue.getActiveCount();
    const waitingCount = await inventoryQueue.getWaitingCount();
    const isScanningNow = activeCount > 0 || waitingCount > 0;

    let nextScan = null;
    if (repeatableJobs.length > 0) {
      nextScan = new Date(repeatableJobs[0].next).toISOString();
    }

    res.json({
      isScanningNow,
      nextScan
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scan status.' });
  }
};

// POST /api/dashboard/scan-now
const triggerScanNow = async (req, res) => {
  try {
    await inventoryQueue.add('stock-check', {
      triggeredAt: new Date().toISOString(),
      manual: true
    });
    res.json({ message: 'Manual stock scan queued successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to trigger stock scan.' });
  }
};

module.exports = { getStats, getTrend, getScanStatus, triggerScanNow };
