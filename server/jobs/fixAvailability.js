/**
 * Fix availability values in database
 */

require('dotenv').config();
const db = require('../db/init');

async function fixAvailability() {
    console.log('Fixing availability values in database...\n');

    try {
        await db.initialize();

        // First, normalize "In Stock" and "in stock" to "in_stock"
        await new Promise((resolve) => {
            db.db.run('UPDATE prices SET availability = "in_stock" WHERE availability IN ("In Stock", "in stock")', function (err) {
                if (err) console.error('Error updating In Stock:', err);
                else console.log(`✓ Updated ${this.changes} records from "In Stock"/"in stock" to "in_stock"`);
                resolve();
            });
        });

        // Then, set any other values to "out_of_stock"
        await new Promise((resolve) => {
            db.db.run('UPDATE prices SET availability = "out_of_stock" WHERE availability NOT IN ("in_stock", "out_of_stock")', function (err) {
                if (err) console.error('Error updating other values:', err);
                else console.log(`✓ Updated ${this.changes} records to "out_of_stock"`);
                resolve();
            });
        });

        // Check final values
        const rows = await new Promise((resolve) => {
            db.db.all('SELECT DISTINCT availability FROM prices', (err, rows) => {
                resolve(rows);
            });
        });

        console.log('\nFinal availability values in database:', rows);
        console.log('\n✅ Database normalized successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAvailability();
