/**
 * Add historical price data from last week
 */

require('dotenv').config();
const db = require('../db/init');

async function addHistoricalData() {
    console.log('Adding historical price data from last week...\n');

    try {
        await db.initialize();

        // Get stores and products
        const stores = await new Promise((resolve, reject) => {
            db.db.all('SELECT id, name FROM stores', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const products = await new Promise((resolve, reject) => {
            db.db.all('SELECT id, name FROM products', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        console.log(`Found ${stores.length} stores and ${products.length} products\n`);

        // Generate data for last 7 days (excluding today)
        const today = new Date('2026-01-18');
        let addedCount = 0;

        for (let daysAgo = 7; daysAgo >= 1; daysAgo--) {
            const date = new Date(today);
            date.setDate(date.getDate() - daysAgo);
            const dateStr = date.toISOString().split('T')[0];

            console.log(`Adding prices for ${dateStr}...`);

            for (const store of stores) {
                for (const product of products) {
                    // Generate realistic prices with slight variations
                    const basePrices = {
                        milk: { base: 6.5, variation: 1.5 },
                        eggs: { base: 4.2, variation: 0.8 },
                        bread: { base: 3.5, variation: 1.0 },
                        butter: { base: 6.5, variation: 2.0 },
                        banana: { base: 1.2, variation: 0.5 },
                    };

                    const priceInfo = basePrices[product.name] || { base: 5, variation: 2 };
                    const price = (priceInfo.base + (Math.random() - 0.5) * priceInfo.variation).toFixed(2);
                    const pricePerUnit = (price / (Math.random() * 2 + 1)).toFixed(2);
                    const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 15) + 5 : 0;
                    const available = Math.random() > 0.1; // 90% available

                    const timestamp = new Date(dateStr + 'T12:00:00Z').getTime();

                    await new Promise((resolve, reject) => {
                        db.db.run(
                            `INSERT INTO prices 
                            (productId, productName, storeId, storeName, price, originalPrice, discount, availability, timestamp)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [product.id, product.name, store.id, store.name, price, (price / (1 - discount / 100)).toFixed(2), discount, available ? 'in_stock' : 'out_of_stock', new Date(dateStr + 'T12:00:00Z').toISOString()],
                            function (err) {
                                if (err) {
                                    console.error(`Error inserting price: ${err.message}`);
                                    reject(err);
                                } else {
                                    addedCount++;
                                    resolve();
                                }
                            }
                        );
                    });
                }
            }
        }

        console.log(`\n✅ Successfully added ${addedCount} historical price records`);
        process.exit(0);
    } catch (error) {
        console.error('Error adding historical data:', error);
        process.exit(1);
    }
}

addHistoricalData();
