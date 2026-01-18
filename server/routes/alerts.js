const express = require('express');
const AlertManager = require('../services/alertManager');

const router = express.Router();

/**
 * GET /api/alerts
 * Get recent alerts
 */
router.get('/', async (req, res) => {
  try {
    const limit = req.query.limit || 20;
    const alerts = await AlertManager.getRecentAlerts(limit);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/alerts/unread
 * Get count of unread alerts
 */
router.get('/unread', async (req, res) => {
  try {
    const count = await AlertManager.getUnreadCount();
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/alerts/:id/read
 * Mark alert as read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await AlertManager.markAlertAsRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/alerts/:id
 * Dismiss an alert
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // In a real app, you might mark it as dismissed instead of deleting
    await AlertManager.markAlertAsRead(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
