const db = require('../db/init');

class ReportGenerator {
  /**
   * Generate weekly inflation report
   * @param {Date} startDate - Start of report period
   * @param {Date} endDate - End of report period
   * @returns {Promise<Object>} Inflation report
   */
  static async generateWeeklyInflationReport(startDate = null, endDate = null) {
    if (!startDate) {
      endDate = new Date();
      startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return new Promise((resolve, reject) => {
      db.db.all(
        `SELECT 
          productName,
          AVG(price) as avgPrice,
          MIN(price) as minPrice,
          MAX(price) as maxPrice,
          COUNT(*) as dataPoints
         FROM prices
         WHERE timestamp >= ? AND timestamp <= ?
         GROUP BY productName
         ORDER BY productName`,
        [startDate.toISOString(), endDate.toISOString()],
        async (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Calculate week-over-week changes
          const previousWeekStart = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          const previousWeekEnd = new Date(startDate.getTime() - 1000);

          db.db.all(
            `SELECT 
              productName,
              AVG(price) as avgPrice
             FROM prices
             WHERE timestamp >= ? AND timestamp <= ?
             GROUP BY productName`,
            [previousWeekStart.toISOString(), previousWeekEnd.toISOString()],
            (err, previousRows) => {
              if (err) {
                reject(err);
                return;
              }

              const previousMap = {};
              previousRows.forEach((row) => {
                previousMap[row.productName] = row.avgPrice;
              });

              const report = {
                period: {
                  start: startDate.toISOString(),
                  end: endDate.toISOString(),
                },
                products: rows.map((row) => ({
                  name: row.productName,
                  currentAvg: parseFloat(row.avgPrice.toFixed(2)),
                  minPrice: parseFloat(row.minPrice.toFixed(2)),
                  maxPrice: parseFloat(row.maxPrice.toFixed(2)),
                  previousWeekAvg: previousMap[row.productName]
                    ? parseFloat(previousMap[row.productName].toFixed(2))
                    : null,
                  weekOverWeekChange: previousMap[row.productName]
                    ? parseFloat(
                      (((row.avgPrice - previousMap[row.productName]) / previousMap[row.productName]) * 100).toFixed(2)
                    )
                    : null,
                  dataPoints: row.dataPoints,
                })),
                generatedAt: new Date().toISOString(),
              };

              resolve(report);
            }
          );
        }
      );
    });
  }

  /**
   * Generate store comparison report
   * @param {string} productName - Product to compare
   * @param {number} limit - Number of days to look back
   * @returns {Promise<Object>} Comparison report
   */
  static async generateStoreComparisonReport(productName, limit = 7) {
    const startDate = new Date(Date.now() - limit * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      db.db.all(
        `SELECT 
          storeName,
          AVG(price) as avgPrice,
          MIN(price) as minPrice,
          MAX(price) as maxPrice,
          COUNT(*) as dataPoints
         FROM prices
         WHERE productName = ? AND timestamp >= ?
         GROUP BY storeName
         ORDER BY avgPrice ASC`,
        [productName, startDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          if (rows.length === 0) {
            resolve({
              productName,
              period: limit,
              stores: [],
              message: 'No data available',
            });
            return;
          }

          const cheapest = rows[0];
          const mostExpensive = rows[rows.length - 1];
          const savings = ((mostExpensive.avgPrice - cheapest.avgPrice) / mostExpensive.avgPrice * 100).toFixed(1);

          const report = {
            productName,
            period: `Last ${limit} days`,
            cheapestStore: {
              name: cheapest.storeName,
              avgPrice: parseFloat(cheapest.avgPrice.toFixed(2)),
            },
            mostExpensiveStore: {
              name: mostExpensive.storeName,
              avgPrice: parseFloat(mostExpensive.avgPrice.toFixed(2)),
            },
            potentialSavings: parseFloat(savings),
            stores: rows.map((row) => ({
              name: row.storeName,
              avgPrice: parseFloat(row.avgPrice.toFixed(2)),
              minPrice: parseFloat(row.minPrice.toFixed(2)),
              maxPrice: parseFloat(row.maxPrice.toFixed(2)),
              dataPoints: row.dataPoints,
            })),
            generatedAt: new Date().toISOString(),
          };

          resolve(report);
        }
      );
    });
  }

  /**
   * Generate monthly trend report
   * @returns {Promise<Object>} Trend data
   */
  static async generateMonthlyTrendReport() {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1);

    return new Promise((resolve, reject) => {
      db.db.all(
        `SELECT 
          DATE(timestamp) as date,
          productName,
          AVG(price) as avgPrice
         FROM prices
         WHERE timestamp >= ?
         GROUP BY DATE(timestamp), productName
         ORDER BY date ASC, productName`,
        [startDate.toISOString()],
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }

          // Organize by product
          const byProduct = {};
          rows.forEach((row) => {
            if (!byProduct[row.productName]) {
              byProduct[row.productName] = [];
            }
            byProduct[row.productName].push({
              date: row.date,
              price: parseFloat(row.avgPrice.toFixed(2)),
            });
          });

          const report = {
            period: 'Last 30 days',
            products: byProduct,
            generatedAt: new Date().toISOString(),
          };

          resolve(report);
        }
      );
    });
  }
}

module.exports = ReportGenerator;
