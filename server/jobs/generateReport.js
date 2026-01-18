/**
 * Generate weekly inflation report
 * Run this as a scheduled job (e.g., every Monday morning)
 */

require('dotenv').config();
const db = require('../db/init');
const ReportGenerator = require('../services/reportGenerator');
const fs = require('fs');
const path = require('path');

async function generateReport() {
  console.log(`[${new Date().toISOString()}] Starting report generation...`);

  try {
    await db.initialize();

    // Generate weekly inflation report
    const weeklyReport = await ReportGenerator.generateWeeklyInflationReport();

    // Generate store comparison for each product
    const storeComparisons = [];
    const products = ['milk', 'rice', 'flour', 'eggs'];

    for (const product of products) {
      const comparison = await ReportGenerator.generateStoreComparisonReport(product, 7);
      storeComparisons.push(comparison);
    }

    // Generate monthly trend
    const monthlyTrend = await ReportGenerator.generateMonthlyTrendReport();

    // Save reports to files
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

    fs.writeFileSync(
      path.join(reportsDir, `weekly-inflation-${timestamp}.json`),
      JSON.stringify(weeklyReport, null, 2)
    );

    fs.writeFileSync(
      path.join(reportsDir, `store-comparison-${timestamp}.json`),
      JSON.stringify(storeComparisons, null, 2)
    );

    fs.writeFileSync(
      path.join(reportsDir, `monthly-trend-${timestamp}.json`),
      JSON.stringify(monthlyTrend, null, 2)
    );

    // Generate human-readable report
    const humanReport = generateHumanReadableReport(weeklyReport, storeComparisons, monthlyTrend);

    fs.writeFileSync(
      path.join(reportsDir, `report-${timestamp}.txt`),
      humanReport
    );

    console.log('📊 Reports generated:');
    console.log(`  - Weekly inflation report`);
    console.log(`  - Store comparisons (${storeComparisons.length} products)`);
    console.log(`  - Monthly trends`);
    console.log(`  - Human-readable summary`);

    console.log(`\n✅ Report generation completed at ${new Date().toISOString()}`);
    await db.close();
  } catch (error) {
    console.error('Fatal error in report generation:', error);
    process.exit(1);
  }
}

function generateHumanReadableReport(inflation, comparisons, trends) {
  const date = new Date().toISOString().split('T')[0];
  let report = `FOOD PRICE DASHBOARD - WEEKLY REPORT
Generated: ${date}

═════════════════════════════════════════════════════════════

INFLATION SUMMARY
─────────────────────────────────────────────────────────────

`;

  inflation.products.forEach((product) => {
    const change = product.weekOverWeekChange ? `${product.weekOverWeekChange > 0 ? '+' : ''}${product.weekOverWeekChange}%` : 'N/A';
    const trend = product.weekOverWeekChange > 0 ? '↑' : product.weekOverWeekChange < 0 ? '↓' : '→';

    report += `${trend} ${product.name.toUpperCase()}\n`;
    report += `   Current Average: $${product.currentAvg} (${product.minPrice}-${product.maxPrice})\n`;
    report += `   Week-over-Week: ${change}\n`;
    report += `   Data Points: ${product.dataPoints}\n\n`;
  });

  report += `═════════════════════════════════════════════════════════════

CHEAPEST STORES TODAY
─────────────────────────────────────────────────────────────

`;

  comparisons.forEach((comp) => {
    if (comp.stores.length > 0) {
      const savings = comp.potentialSavings || 0;
      report += `${comp.productName.toUpperCase()}\n`;
      report += `   Cheapest: ${comp.cheapestStore.name} at $${comp.cheapestStore.avgPrice}\n`;
      report += `   Most Expensive: ${comp.mostExpensiveStore.name} at $${comp.mostExpensiveStore.avgPrice}\n`;
      report += `   Potential Savings: ${savings}%\n\n`;
    }
  });

  report += `═════════════════════════════════════════════════════════════

KEY INSIGHTS
─────────────────────────────────────────────────────────────

• Check store comparison above to find the best deals
• Price spikes detected for: (See alerts in dashboard)
• Historical data shows 30-day trends available online
• Low-income households can save significantly by shopping strategically

═════════════════════════════════════════════════════════════
`;

  return report;
}

// Run the report generation
generateReport().catch(console.error);
