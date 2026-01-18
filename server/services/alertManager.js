const db = require('../db/init');
const { alertConfig } = require('../config');

class AlertManager {
  /**
   * Check for price spikes and create alerts
   * @param {Object} product - Current product with price
   * @param {Object} previousAvg - Previous average price data
   * @returns {Promise<Object|null>} Alert object if spike detected
   */
  static async checkPriceSpike(product, previousAvg) {
    if (!alertConfig.enabled || !previousAvg) {
      return null;
    }

    const priceChange = Math.abs(product.currentPrice - previousAvg.price) / previousAvg.price * 100;

    if (priceChange > alertConfig.priceSpikethreshold) {
      const alert = {
        productId: product.id,
        productName: product.title,
        storeId: product.storeId,
        storeName: product.storeName,
        previousPrice: previousAvg.price,
        currentPrice: product.currentPrice,
        priceChange: priceChange,
        severity: priceChange > 25 ? 'high' : 'medium',
        createdAt: new Date().toISOString(),
      };

      await this.saveAlert(alert);
      return alert;
    }

    return null;
  }

  /**
   * Save alert to database
   * @param {Object} alert - Alert object
   */
  static async saveAlert(alert) {
    return new Promise((resolve, reject) => {
      db.db.run(
        `INSERT INTO alerts (productId, productName, storeId, storeName, previousPrice, currentPrice, priceChange, severity, createdAt, read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alert.productId,
          alert.productName,
          alert.storeId,
          alert.storeName,
          alert.previousPrice,
          alert.currentPrice,
          alert.priceChange,
          alert.severity,
          alert.createdAt,
          false,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Get recent alerts
   * @param {number} limit - Number of alerts to return
   * @returns {Promise<Array>} Alert list
   */
  static async getRecentAlerts(limit = 20) {
    return new Promise((resolve, reject) => {
      db.db.all(
        `SELECT * FROM alerts ORDER BY createdAt DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  /**
   * Mark alert as read
   * @param {number} alertId - Alert ID
   */
  static async markAlertAsRead(alertId) {
    return new Promise((resolve, reject) => {
      db.db.run(
        `UPDATE alerts SET read = 1 WHERE id = ?`,
        [alertId],
        function (err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Get unread alert count
   * @returns {Promise<number>} Count of unread alerts
   */
  static async getUnreadCount() {
    return new Promise((resolve, reject) => {
      db.db.get(
        `SELECT COUNT(*) as count FROM alerts WHERE read = 0`,
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        }
      );
    });
  }

  /**
   * Clear old alerts (older than N days)
   * @param {number} days - Number of days to keep
   */
  static async clearOldAlerts(days = 30) {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    return new Promise((resolve, reject) => {
      db.db.run(
        `DELETE FROM alerts WHERE createdAt < ?`,
        [cutoffDate],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  }
}

module.exports = AlertManager;
