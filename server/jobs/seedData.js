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

        console.log('✅ Database initialization completed!');
        console.log('Ready to collect real prices from Yellowcake API.\n');

        await db.close();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

seedDatabase();
