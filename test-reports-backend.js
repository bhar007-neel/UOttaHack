const db = require('./server/db/init');
const ReportGenerator = require('./server/services/reportGenerator');

async function test() {
    try {
        await db.initialize();

        console.log('Testing weekly inflation...');
        const inflation = await ReportGenerator.generateWeeklyInflationReport();
        console.log('✓ Inflation - Products:', inflation.products.length);
        console.log('  Data:', JSON.stringify(inflation.products[0], null, 2));

        console.log('\nTesting store comparison...');
        const comparison = await ReportGenerator.generateStoreComparisonReport('milk', 7);
        console.log('✓ Comparison - Stores:', comparison.stores.length);
        console.log('  Data:', JSON.stringify(comparison.stores[0], null, 2));

        console.log('\nTesting monthly trend...');
        const trend = await ReportGenerator.generateMonthlyTrendReport();
        console.log('✓ Trend - Products:', Object.keys(trend.products).length);
        const firstProduct = Object.keys(trend.products)[0];
        console.log(`  ${firstProduct}:`, trend.products[firstProduct].length, 'data points');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

test();
