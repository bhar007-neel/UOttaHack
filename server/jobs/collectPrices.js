/**
 * Collect prices from grocery stores using Yellowcake API
 * Run this as a scheduled job (e.g., every 6 hours)
 */

require('dotenv').config();
const db = require('../db/init');

// Use mock API only if explicitly enabled
const USE_MOCK_API = process.env.USE_MOCK_API === 'true';
const yellowcake = USE_MOCK_API
    ? require('../api/mockYellowcake')
    : require('../api/yellowcake');

const PriceNormalizer = require('../services/priceNormalizer');
const AlertManager = require('../services/alertManager');
const { trackedStores, trackedProducts } = require('../config');

// Mock store configurations (in production, fetch from database)
const STORE_CONFIG = [
    {
        id: 1,
        name: 'Real Canadian Superstore',
        url: 'https://www.realcanadiansuperstore.ca/en',
    },
    {
        id: 2,
        name: 'Loblaws',
        url: 'https://www.loblaws.ca/',
    },
    {
        id: 3,
        name: 'Walmart',
        url: 'https://www.walmart.ca',
    },
    {
        id: 4,
        name: 'Costco',
        url: 'https://www.costco.ca',
    },
    {
        id: 5,
        name: 'Metro',
        url: 'https://www.metro.ca',
    }
];

async function collectPrices() {
    console.log(`[${new Date().toISOString()}] Starting price collection...`);

    try {
        await db.initialize();

        for (const store of STORE_CONFIG) {
            console.log(`\nCollecting prices from ${store.name}...`);

            try {
                // Search for all tracked products at this store
                const results = await yellowcake.searchMultipleProducts(store.url, trackedProducts);

                // Process results for each product
                for (const productName of trackedProducts) {
                    const listings = results[productName] || [];

                    if (listings.length === 0) {
                        console.log(`  ⚠️  No listings found for ${productName}`);
                        continue;
                    }

                    // Take the first (most relevant) listing
                    const listing = listings[0];

                    // Normalize the product data
                    const normalized = PriceNormalizer.normalizeProduct({
                        title: listing.title || productName,
                        price: listing.price,
                        unit: listing.unit || 'item',
                        original_price: listing.original_price,
                        availability: listing.availability || 'in_stock',
                        url: listing.url,
                    });

                    // Get previous average price for alert detection
                    const prevAvg = await getPreviousAveragePrice(productName, store.id);

                    // Check for price spikes
                    if (prevAvg) {
                        const alert = await AlertManager.checkPriceSpike(
                            {
                                id: 1,
                                title: productName,
                                currentPrice: normalized.currentPrice,
                                storeId: store.id,
                                storeName: store.name,
                            },
                            prevAvg
                        );

                        if (alert) {
                            console.log(`  🚨 ALERT: ${productName} at ${store.name} - ${alert.severity} spike!`);
                        }
                    }

                    // Save price to database
                    await savePrice({
                        productId: 1, // In production, look up real product ID
                        productName: productName,
                        storeId: store.id,
                        storeName: store.name,
                        ...normalized,
                    });

                    console.log(`  ✓ ${productName}: $${normalized.currentPrice} (${normalized.normalizedPrice}/kg)`);
                }
            } catch (error) {
                console.error(`  ✗ Error collecting from ${store.name}:`, error.message);
                // Continue with next store on error
            }
        }

        console.log(`\n✅ Price collection completed at ${new Date().toISOString()}`);
        await db.close();
    } catch (error) {
        console.error('Fatal error in price collection:', error);
        process.exit(1);
    }
}

/**
 * Get previous average price for price spike detection
 */
async function getPreviousAveragePrice(productName, storeId) {
    return new Promise((resolve) => {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        db.db.get(
            `SELECT AVG(price) as price FROM prices
       WHERE productName = ? AND storeId = ? AND timestamp < ?
       ORDER BY timestamp DESC LIMIT 100`,
            [productName, storeId, oneDayAgo],
            (err, row) => {
                if (err || !row || row.price === null) {
                    resolve(null);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

/**
 * Save price to database
 */
function savePrice(priceData) {
    return new Promise((resolve, reject) => {
        db.db.run(
            `INSERT INTO prices (
        productId, productName, storeId, storeName,
        price, originalPrice, discount, normalizedPrice,
        availability, unit, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                priceData.productId,
                priceData.productName,
                priceData.storeId,
                priceData.storeName,
                priceData.currentPrice,
                priceData.originalPrice,
                priceData.discount,
                priceData.normalizedPrice,
                priceData.availability,
                priceData.normalizedUnit,
                priceData.url,
            ],
            function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
            }
        );
    });
}

// Run the collection
collectPrices().catch(console.error);
