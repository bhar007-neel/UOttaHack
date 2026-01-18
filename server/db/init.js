const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { dbConfig } = require('../config');

class Database {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(dbConfig.path);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(dbConfig.path, async (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('Connected to SQLite database');

        try {
          await this.createTables();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Create database tables
   */
  async createTables() {
    const schema = `
      -- Stores table
      CREATE TABLE IF NOT EXISTS stores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        url TEXT,
        city TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Products table
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT,
        unit TEXT DEFAULT 'item',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Price history table
      CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        productName TEXT NOT NULL,
        storeId INTEGER NOT NULL,
        storeName TEXT NOT NULL,
        price REAL NOT NULL,
        originalPrice REAL,
        discount INTEGER DEFAULT 0,
        normalizedPrice REAL,
        availability TEXT DEFAULT 'in_stock',
        unit TEXT DEFAULT 'item',
        url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (storeId) REFERENCES stores(id)
      );

      CREATE INDEX IF NOT EXISTS idx_product_timestamp ON prices(productId, timestamp);
      CREATE INDEX IF NOT EXISTS idx_store_timestamp ON prices(storeId, timestamp);
      CREATE INDEX IF NOT EXISTS idx_timestamp ON prices(timestamp);

      -- Alerts table
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER,
        productName TEXT NOT NULL,
        storeId INTEGER,
        storeName TEXT NOT NULL,
        previousPrice REAL,
        currentPrice REAL NOT NULL,
        priceChange REAL NOT NULL,
        severity TEXT DEFAULT 'medium',
        read INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        dismissedAt DATETIME,
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (storeId) REFERENCES stores(id)
      );

      CREATE INDEX IF NOT EXISTS idx_severity_read ON alerts(severity, read);
      CREATE INDEX IF NOT EXISTS idx_created_at ON alerts(createdAt);

      -- Price statistics (cached aggregates)
      CREATE TABLE IF NOT EXISTS price_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        productId INTEGER NOT NULL,
        productName TEXT NOT NULL,
        storeId INTEGER NOT NULL,
        storeName TEXT NOT NULL,
        avgPrice REAL,
        minPrice REAL,
        maxPrice REAL,
        dataPoints INTEGER,
        period TEXT DEFAULT 'weekly',
        calculatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (productId) REFERENCES products(id),
        FOREIGN KEY (storeId) REFERENCES stores(id)
      );

      CREATE INDEX IF NOT EXISTS idx_period_calculated ON price_stats(period, calculatedAt);
    `;

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database tables created/verified');
          resolve();
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new Database();
