const express = require('express');
const db = require('../db/init');

const router = express.Router();

// Store scraping status
let scrapingStatus = {
    isActive: false,
    progress: 0,
    message: '',
    productsScraped: 0,
    totalProducts: 0,
};

/**
 * GET /api/scraper/status
 * Get current scraping status
 */
router.get('/status', (req, res) => {
    res.json(scrapingStatus);
});

/**
 * POST /api/scraper/start
 * Start price collection scraping
 * Optional query param: productId - only scrape this product
 */
router.post('/start', async (req, res) => {
    if (scrapingStatus.isActive) {
        return res.status(400).json({ error: 'Scraping already in progress' });
    }

    const { productId } = req.query;

    scrapingStatus.isActive = true;
    scrapingStatus.progress = 0;
    scrapingStatus.message = 'Starting price collection...';
    scrapingStatus.productsScraped = 0;

    res.json({ success: true, message: 'Scraping started' });

    // Run scraping in background
    runScraper(productId).catch((err) => {
        console.error('Scraping error:', err);
        scrapingStatus.isActive = false;
        scrapingStatus.message = 'Error: ' + err.message;
    });
});

async function runScraper(productId = null) {
    try {
        require('dotenv').config();
        // Use real Yellowcake API (set USE_MOCK_API=true to use mock)
        const USE_MOCK_API = process.env.USE_MOCK_API === 'true';
        const yellowcake = USE_MOCK_API
            ? require('../api/mockYellowcake')
            : require('../api/yellowcake');

        scrapingStatus.message = 'Initializing...';
        scrapingStatus.progress = 5;

        // Get products and stores from database
        let query = 'SELECT id, name FROM products';
        const params = [];

        if (productId) {
            query += ' WHERE id = ?';
            params.push(parseInt(productId));
        }

        const products = await new Promise((resolve, reject) => {
            db.db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const stores = await new Promise((resolve, reject) => {
            db.db.all('SELECT id, name, url FROM stores', (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const totalCombos = products.length * stores.length;
        let processed = 0;

        scrapingStatus.message = `Found ${products.length} product(s) and ${stores.length} stores...`;
        scrapingStatus.progress = 10;

        console.log(`[SCRAPER] Starting scrape: ${products.length} products, ${stores.length} stores`);
        console.log(`[SCRAPER] Stores:`, stores);

        // Collect prices for each product-store combination
        for (const product of products) {
            for (const store of stores) {
                try {
                    if (!store.url) {
                        console.warn(`Store ${store.name} has no URL, skipping...`);
                        processed++;
                        scrapingStatus.progress = 10 + Math.floor((processed / totalCombos) * 80);
                        continue;
                    }

                    scrapingStatus.message = `Collecting ${product.name} at ${store.name}...`;
                    const products_found = await yellowcake.searchProducts(store.url, product.name);

                    console.log(`[SCRAPER] Found ${products_found ? products_found.length : 0} products for ${product.name} at ${store.name}`);

                    if (products_found && products_found.length > 0) {
                        for (const foundProduct of products_found) {
                            await new Promise((resolve, reject) => {
                                db.db.run(
                                    `INSERT INTO prices (productId, productName, storeId, storeName, price, availability, timestamp, url, unit)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                    [
                                        product.id,
                                        foundProduct.title || product.name,
                                        store.id,
                                        store.name,
                                        parseFloat(foundProduct.price) || null,
                                        foundProduct.availability || 'unknown',
                                        new Date().toISOString(),
                                        foundProduct.product_url || foundProduct.url || store.url,
                                        foundProduct.unit || 'item',
                                    ],
                                    function (err) {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });
                        }
                        scrapingStatus.productsScraped += products_found.length;
                        console.log(`[SCRAPER] Updated productsScraped to: ${scrapingStatus.productsScraped}`);
                    }

                    processed++;
                    scrapingStatus.progress = 10 + Math.floor((processed / totalCombos) * 80);
                } catch (err) {
                    console.error(`Error collecting ${product.name} at ${store.name}:`, err.message);
                    processed++;
                    scrapingStatus.progress = 10 + Math.floor((processed / totalCombos) * 80);
                }
            }
        }

        scrapingStatus.message = 'Scraping complete! ✓';
        scrapingStatus.progress = 100;
        // isActive stays true to show the completion UI

        // Keep showing completion for 10 seconds before resetting
        setTimeout(() => {
            scrapingStatus.isActive = false;
            scrapingStatus.progress = 0;
            scrapingStatus.message = '';
            scrapingStatus.productsScraped = 0;
        }, 10000);
    } catch (error) {
        scrapingStatus.isActive = false;
        scrapingStatus.message = 'Error: ' + error.message;
        console.error('Scraper error:', error);
    }
}

module.exports = router;
