/**
 * Initialize database with stores and products (no sample data)
 */

require('dotenv').config();
const db = require('../db/init');

async function seedDatabase() {
    console.log('Initializing database with stores and products...\n');

    try {
        await db.initialize();

        // Sample stores
        const stores = [
            { name: 'Loblaws', url: 'https://www.loblaws.ca' },
            { name: 'Costco', url: 'https://www.costco.ca' },
            { name: 'Metro', url: 'https://www.metro.ca' },
        ];

        // Products to track
        const products = [
            { name: 'milk', unit: 'L' },
            { name: 'eggs', unit: 'dozen' },
            { name: 'bread', unit: 'loaf' },
            { name: 'butter', unit: 'kg' },
            { name: 'banana', unit: 'lb' },
        ];

        // Insert stores
        console.log('Adding stores...');
        for (const store of stores) {
            await new Promise((resolve) => {
                db.db.run(
                    `INSERT OR IGNORE INTO stores (name, url) VALUES (?, ?)`,
                    [store.name, store.url],
                    resolve
                );
            });
        }
        console.log(`✓ Added ${stores.length} stores\n`);

        // Insert products
        console.log('Adding products...');
        for (const product of products) {
            await new Promise((resolve) => {
                db.db.run(
                    `INSERT OR IGNORE INTO products (name, unit) VALUES (?, ?)`,
                    [product.name, product.unit],
                    resolve
                );
            });
        }
        console.log(`✓ Added ${products.length} products\n`);

        // Insert sample prices for the last 7 days
        console.log('Adding sample price history...');
        const today = new Date();
        let priceCount = 0;

        for (let day = 0; day <= 6; day++) {
            const date = new Date(today);
            date.setDate(date.getDate() - day);
            date.setHours(Math.floor(Math.random() * 20) + 4, Math.floor(Math.random() * 60));

            const samplePrices = [
                { store: 'Loblaws', product: 'milk', price: 4.49, original: 4.99, discount: 10, normalized: 4.49 },
                { store: 'Costco', product: 'milk', price: 3.99, original: 3.99, discount: 0, normalized: 3.99 },
                { store: 'Metro', product: 'milk', price: 4.89, original: 5.49, discount: 11, normalized: 4.89 },

                { store: 'Loblaws', product: 'eggs', price: 2.99, original: 3.49, discount: 14, normalized: 2.99 },
                { store: 'Costco', product: 'eggs', price: 8.99, original: 8.99, discount: 0, normalized: 8.99 },
                { store: 'Metro', product: 'eggs', price: 3.29, original: 3.99, discount: 18, normalized: 3.29 },

                { store: 'Loblaws', product: 'bread', price: 2.99, original: 3.49, discount: 14, normalized: 2.99 },
                { store: 'Costco', product: 'bread', price: 1.99, original: 1.99, discount: 0, normalized: 1.99 },
                { store: 'Metro', product: 'bread', price: 3.19, original: 3.99, discount: 20, normalized: 3.19 },

                { store: 'Loblaws', product: 'butter', price: 4.99, original: 5.99, discount: 17, normalized: 4.99 },
                { store: 'Costco', product: 'butter', price: 3.99, original: 3.99, discount: 0, normalized: 3.99 },
                { store: 'Metro', product: 'butter', price: 5.29, original: 5.99, discount: 12, normalized: 5.29 },

                { store: 'Loblaws', product: 'banana', price: 0.69, original: 0.79, discount: 13, normalized: 1.52 },
                { store: 'Costco', product: 'banana', price: 0.59, original: 0.59, discount: 0, normalized: 1.30 },
                { store: 'Metro', product: 'banana', price: 0.79, original: 0.89, discount: 11, normalized: 1.74 },
            ];

            for (const entry of samplePrices) {
                // Add slight variation over days
                const variation = (Math.random() - 0.5) * 0.3;
                const adjustedPrice = entry.price + variation;

                await new Promise((resolve) => {
                    db.db.run(
                        `INSERT INTO prices (productId, productName, storeId, storeName, price, originalPrice, discount, normalizedPrice, availability, unit, timestamp)
                         VALUES (1, ?, 1, ?, ?, ?, ?, ?, 'in_stock', ?, ?)`,
                        [
                            entry.product,
                            entry.store,
                            adjustedPrice.toFixed(2),
                            (adjustedPrice + 0.5).toFixed(2),
                            entry.discount,
                            entry.normalized,
                            entry.product === 'milk' ? 'L' : entry.product === 'eggs' ? 'dozen' : entry.product === 'bread' ? 'loaf' : entry.product === 'butter' ? 'kg' : 'lb',
                            date.toISOString(),
                        ],
                        function () {
                            priceCount++;
                            resolve();
                        }
                    );
                });
            }
        }

        console.log(`✓ Added ${priceCount} price records\n`);

        // Add some sample alerts
        console.log('Adding sample alerts...');
        const alerts = [
            {
                productName: 'milk',
                storeName: 'Metro',
                previousPrice: 4.49,
                currentPrice: 5.29,
                priceChange: 17.8,
                severity: 'high',
            },
            {
                productName: 'bread',
                storeName: 'Loblaws',
                previousPrice: 2.99,
                currentPrice: 3.49,
                priceChange: 16.7,
                severity: 'medium',
            },
        ];

        for (const alert of alerts) {
            await new Promise((resolve) => {
                db.db.run(
                    `INSERT INTO alerts (productName, storeId, storeName, previousPrice, currentPrice, priceChange, severity, read)
                     VALUES (?, 1, ?, ?, ?, ?, ?, 0)`,
                    [
                        alert.productName,
                        alert.storeName,
                        alert.previousPrice,
                        alert.currentPrice,
                        alert.priceChange,
                        alert.severity,
                    ],
                    resolve
                );
            });
        }

        console.log(`✓ Added ${alerts.length} sample alerts\n`);

        console.log('✅ Database seeding completed!');
        console.log('The dashboard should now show sample data.\n');

        await db.close();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
