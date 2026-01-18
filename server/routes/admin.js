const express = require('express');
const db = require('../db/init');

const router = express.Router();

/**
 * GET /api/admin/products
 * Get all tracked products
 */
router.get('/products', (req, res) => {
    db.db.all('SELECT id, name, unit FROM products ORDER BY name', (err, rows) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).json({ error: 'Failed to fetch products' });
        }
        res.json({ products: rows || [] });
    });
});

/**
 * POST /api/admin/products
 * Add a new product
 */
router.post('/products', (req, res) => {
    const { name, unit } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    db.db.run(
        'INSERT INTO products (name, unit) VALUES (?, ?)',
        [name.trim(), unit || 'item'],
        function (err) {
            if (err) {
                console.error('Error adding product:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, unit: unit || 'item' });
        }
    );
});

/**
 * PUT /api/admin/products/:id
 * Update a product
 */
router.put('/products/:id', (req, res) => {
    const { id } = req.params;
    const { name, unit } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Product name is required' });
    }

    db.db.run(
        'UPDATE products SET name = ?, unit = ? WHERE id = ?',
        [name.trim(), unit || 'item', id],
        function (err) {
            if (err) {
                console.error('Error updating product:', err);
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }
            res.json({ id: parseInt(id), name, unit: unit || 'item' });
        }
    );
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product
 */
router.delete('/products/:id', (req, res) => {
    const { id } = req.params;

    db.db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ success: true });
    });
});

/**
 * GET /api/admin/stores
 * Get all stores
 */
router.get('/stores', (req, res) => {
    db.db.all('SELECT id, name, url FROM stores ORDER BY name', (err, rows) => {
        if (err) {
            console.error('Error fetching stores:', err);
            return res.status(500).json({ error: 'Failed to fetch stores' });
        }
        res.json({ stores: rows || [] });
    });
});

/**
 * POST /api/admin/stores
 * Add a new store
 */
router.post('/stores', (req, res) => {
    const { name, url } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Store name is required' });
    }

    db.db.run(
        'INSERT INTO stores (name, url) VALUES (?, ?)',
        [name.trim(), url?.trim() || ''],
        function (err) {
            if (err) {
                console.error('Error adding store:', err);
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ id: this.lastID, name, url: url || '' });
        }
    );
});

/**
 * PUT /api/admin/stores/:id
 * Update a store
 */
router.put('/stores/:id', (req, res) => {
    const { id } = req.params;
    const { name, url } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Store name is required' });
    }

    db.db.run(
        'UPDATE stores SET name = ?, url = ? WHERE id = ?',
        [name.trim(), url?.trim() || '', id],
        function (err) {
            if (err) {
                console.error('Error updating store:', err);
                return res.status(500).json({ error: err.message });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Store not found' });
            }
            res.json({ id: parseInt(id), name, url: url || '' });
        }
    );
});

/**
 * DELETE /api/admin/stores/:id
 * Delete a store
 */
router.delete('/stores/:id', (req, res) => {
    const { id } = req.params;

    db.db.run('DELETE FROM stores WHERE id = ?', [id], function (err) {
        if (err) {
            console.error('Error deleting store:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
