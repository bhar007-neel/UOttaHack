const express = require('express');
const { trackedProducts, trackedStores } = require('../config');

const router = express.Router();

router.get('/tracked-products', (req, res) => {
    const products = (trackedProducts || []).map((p) => p.trim()).filter(Boolean);
    res.json({ products });
});

router.get('/tracked-stores', (req, res) => {
    const stores = (trackedStores || []).map((s) => s.trim()).filter(Boolean);
    res.json({ stores });
});

module.exports = router;
