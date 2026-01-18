const express = require('express');
const ReportGenerator = require('../services/reportGenerator');

const router = express.Router();

/**
 * GET /api/reports/weekly-inflation
 * Get weekly inflation report
 */
router.get('/weekly-inflation', async (req, res) => {
  try {
    const report = await ReportGenerator.generateWeeklyInflationReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/store-comparison
 * Compare prices across stores for a product
 */
router.get('/store-comparison', async (req, res) => {
  try {
    const { product, days } = req.query;

    if (!product) {
      res.status(400).json({ error: 'Product name is required' });
      return;
    }

    const report = await ReportGenerator.generateStoreComparisonReport(product, days || 7);
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/reports/monthly-trend
 * Get monthly price trends
 */
router.get('/monthly-trend', async (req, res) => {
  try {
    const report = await ReportGenerator.generateMonthlyTrendReport();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
