const db = require('./server/db/init.js');

const today = '2026-01-18';

db.initialize().then(() => {
    console.log('Testing cheapest query for:', today);

    db.db.all(`SELECT 
    productName,
    storeName,
    price,
    normalizedPrice,
    discount,
    DATE(timestamp) as price_date
   FROM prices
   WHERE DATE(timestamp) = ?
   AND price = (
     SELECT MIN(price) FROM prices p2
     WHERE p2.productName = prices.productName
     AND DATE(p2.timestamp) = ?
   )
   ORDER BY productName`, [today, today], (err, rows) => {
        if (err) {
            console.error('Error:', err);
        } else {
            console.log('Result count:', rows.length);
            console.log('Cheapest prices:', JSON.stringify(rows, null, 2));
        }
        process.exit(0);
    });
}).catch(e => { console.error(e); process.exit(1); });
