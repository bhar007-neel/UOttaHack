const express = require('express');
const db = require('../db/init');

const router = express.Router();

/**
 * GET /api/prices/current
 * Get current prices for all tracked products
 */
router.get('/current', (req, res) => {
  db.db.all(
    `SELECT DISTINCT 
      productName,
      storeName,
      price,
      normalizedPrice,
      discount,
      availability,
      timestamp
     FROM prices
     WHERE timestamp = (
       SELECT MAX(timestamp) FROM prices p2 
       WHERE p2.productName = prices.productName 
       AND p2.storeName = prices.storeName
     )
     ORDER BY productName, price ASC`,
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // Group by product
      const grouped = {};
      rows.forEach((row) => {
        if (!grouped[row.productName]) {
          grouped[row.productName] = [];
        }
        grouped[row.productName].push(row);
      });

      res.json(grouped);
    }
  );
});

/**
 * GET /api/prices/cheapest
 * Get cheapest store for each product today
 */
router.get('/cheapest', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  console.log('Fetching cheapest prices for date:', today);

  db.db.all(
    `SELECT 
      productName,
      storeName,
      price,
      normalizedPrice,
      discount,
      availability,
      DATE(timestamp) as price_date
     FROM prices
     WHERE DATE(timestamp) = ?
     AND price = (
       SELECT MIN(price) FROM prices p2
       WHERE p2.productName = prices.productName
       AND DATE(p2.timestamp) = ?
     )
     ORDER BY productName`,
    [today, today],
    (err, rows) => {
      if (err) {
        console.error('Error fetching cheapest prices:', err);
        res.status(500).json({ error: err.message });
        return;
      }

      console.log(`Found ${rows.length} cheapest price records for today`);
      if (rows.length === 0) {
        console.log('No prices found for today, checking available dates...');
        db.db.all('SELECT DISTINCT DATE(timestamp) as date FROM prices LIMIT 5', (err, dates) => {
          if (!err) console.log('Available dates in DB:', dates);
        });
      }

      const result = {};
      rows.forEach((row) => {
        result[row.productName] = {
          store: row.storeName,
          price: row.price,
          normalizedPrice: row.normalizedPrice,
          discount: row.discount,
          availability: row.availability,
        };
      });

      res.json(result);
    }
  );
});

/**
 * GET /api/prices/history/:productName
 * Get price history for a product
 */
router.get('/history/:productName', (req, res) => {
  const { productName } = req.params;
  const days = req.query.days || 30;

  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  db.db.all(
    `SELECT 
      DATE(timestamp) as date,
      storeName,
      AVG(price) as avgPrice,
      MIN(price) as minPrice,
      MAX(price) as maxPrice,
      COUNT(*) as dataPoints
     FROM prices
     WHERE productName = ? AND timestamp >= ?
     GROUP BY DATE(timestamp), storeName
     ORDER BY date DESC`,
    [productName, startDate],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        product: productName,
        days: parseInt(days),
        history: rows,
      });
    }
  );
});

/**
 * GET /api/prices/store/:storeName
 * Get all current prices at a store
 */
router.get('/store/:storeName', (req, res) => {
  const { storeName } = req.params;

  db.db.all(
    `SELECT DISTINCT
      productName,
      price,
      normalizedPrice,
      discount,
      availability,
      timestamp
     FROM prices
     WHERE storeName = ?
     AND timestamp = (
       SELECT MAX(timestamp) FROM prices p2
       WHERE p2.storeName = prices.storeName
       AND p2.productName = prices.productName
     )
     ORDER BY productName`,
    [storeName],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.json({
        store: storeName,
        products: rows,
      });
    }
  );
});

/**
 * POST /api/prices
 * Save new price data (called by price collection job)
 */
router.post('/', (req, res) => {
  const { productId, productName, storeId, storeName, price, originalPrice, discount, normalizedPrice, availability, unit, url } = req.body;

  if (!productName || !storeName || price === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  db.db.run(
    `INSERT INTO prices (productId, productName, storeId, storeName, price, originalPrice, discount, normalizedPrice, availability, unit, url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [productId, productName, storeId, storeName, price, originalPrice, discount, normalizedPrice, availability, unit, url],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      res.status(201).json({ id: this.lastID });
    }
  );
});

module.exports = router;
