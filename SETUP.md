# BargainBasket

A comprehensive dashboard for tracking grocery store prices and availability using the Yellowcake API. Helps low-income households find the best deals on essentials.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Yellowcake API key

### Installation

1. **Clone and setup**
```bash
cd "UOttaHack"
npm install
cd client && npm install && cd ..
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your Yellowcake API key
```

3. **Initialize database**
```bash
npm run db:migrate
```

4. **Start development**
```bash
npm run dev
```

The dashboard will open at `http://localhost:3000` and the API at `http://localhost:5002`.

## Architecture

### Backend (Node.js/Express)

**Core Components:**
- `server/api/yellowcake.js` - Yellowcake API integration for web scraping
- `server/services/priceNormalizer.js` - Normalize prices to standard units ($/kg)
- `server/services/alertManager.js` - Price spike detection and alerts
- `server/services/reportGenerator.js` - Generate reports and trends
- `server/jobs/collectPrices.js` - Scheduled price collection (every 6h)
- `server/jobs/generateReport.js` - Weekly inflation reports

**API Endpoints:**

```
Prices:
  GET  /api/prices/current           - Get latest prices for all products
  GET  /api/prices/cheapest          - Get cheapest store for each product
  GET  /api/prices/history/:product  - Get price history (days param)
  GET  /api/prices/store/:storeName  - Get all prices at a store
  POST /api/prices                   - Save new price (internal)

Alerts:
  GET  /api/alerts                   - Get recent alerts
  GET  /api/alerts/unread            - Get unread alert count
  PUT  /api/alerts/:id/read          - Mark alert as read
  DELETE /api/alerts/:id             - Dismiss alert

Reports:
  GET  /api/reports/weekly-inflation - Weekly inflation report
  GET  /api/reports/store-comparison - Price comparison (product param)
  GET  /api/reports/monthly-trend    - 30-day trends
```

### Frontend (React)

**Pages:**
- `Dashboard` - Overview with quick stats and top deals
- `Prices` - Detailed price table with all stores
- `Alerts` - Price spike notifications
- `Reports` - Charts and analysis

**Components:**
- `CurrentPrices.jsx` - Price table
- `CheapestStores.jsx` - Daily best deals
- `Alerts.jsx` - Alert management
- `Reports.jsx` - Analytics and trends

### Database (SQLite)

**Tables:**
- `stores` - Store information
- `products` - Product catalog
- `prices` - Historical price records
- `alerts` - Price spike events
- `price_stats` - Cached aggregates

## Key Features

### 1. Price Tracking
- Daily updates from multiple stores
- Unit normalization ($/kg, $/item)
- Discount calculation
- Stock status tracking

### 2. Price Alerts
- Configurable spike thresholds (default: 15%)
- Severity levels (medium/high)
- Read/unread tracking
- Auto-cleanup of old alerts

### 3. Reports
- **Weekly Inflation**: Compare week-over-week changes
- **Store Comparison**: Find cheapest stores per product
- **Monthly Trends**: 30-day price charts
- **Savings Analysis**: Calculate potential savings

### 4. Yellowcake Integration
```javascript
// Search for products
const results = await yellowcake.searchProducts(
  'https://store.example.com',
  'milk'
);

// Extract data from store pages
const data = await yellowcake.extractData(
  'https://store.example.com/produce',
  [{ name: 'price', selector: '.price' }]
);

// Monitor individual product pages
const product = await yellowcake.monitorProduct(
  'https://store.example.com/products/milk-1l'
);
```

## How Yellowcake API Works

The Yellowcake API handles complex web scraping:

1. **Product Search**: Queries store websites for specific products
2. **Data Extraction**: Uses CSS selectors to pull prices, availability, discounts
3. **JavaScript Execution**: Handles dynamic content that requires browser automation
4. **Normalization**: Returns consistent JSON structure across all stores

## Example Data Flow

```
1. Scheduled Job (collectPrices.js)
   ↓
2. Query Yellowcake API for product listings
   ↓
3. Extract prices, units, availability
   ↓
4. Normalize to standard units ($/kg)
   ↓
5. Check for price spikes (vs 24h history)
   ↓
6. Save to database + trigger alerts
   ↓
7. Frontend fetches and displays in real-time
```

## Configuration

**Environment Variables:**
```
PORT=5002                           # API port
YELLOWCAKE_API_KEY=...             # Required: Yellowcake API key
YELLOWCAKE_API_BASE_URL=...        # Optional: API endpoint
DB_PATH=./data/food-prices.db      # SQLite database location
ENABLE_PRICE_ALERTS=true           # Enable price spike detection
ALERT_PRICE_SPIKE_THRESHOLD=15     # % change to trigger alert
COLLECTION_INTERVAL_MINUTES=360    # 6 hours between collections
TRACKED_STORES=store1,store2,...   # Store IDs to monitor
TRACKED_PRODUCTS=milk,rice,flour,eggs # Products to track
```

## For Low-Income Households

This dashboard helps families:
- ✅ **Save Money**: Identify cheapest stores for each item
- ✅ **Plan Shopping**: Compare prices before trips
- ✅ **Track Inflation**: See how prices affect their budget
- ✅ **Get Alerts**: Never overpay when prices spike
- ✅ **Optimize Routes**: Shop at multiple stores strategically

## Example Savings

- Milk: $1.99 @ Budget Groceries vs $2.49 @ Fresh Market (20% savings)
- Rice (5kg): $8.50 @ Community Market vs $11.99 @ Fresh Market (29% savings)

## Development

**Available Commands:**
```bash
npm run dev                 # Start dev server + client
npm run server:dev         # Start backend only (nodemon)
npm run client:dev         # Start frontend only
npm run collect:prices     # Run price collection job
npm run generate:report    # Generate weekly report
npm run db:migrate         # Initialize database
```

## Deployment

### Production Build
```bash
npm run server:build       # Compile TypeScript
cd client && npm run build # Build React app
npm start                  # Start production server
```

### Scheduled Jobs
Use a cron service or job scheduler:
```bash
# Every 6 hours
0 */6 * * * node /path/to/collectPrices.js

# Every Monday 6am
0 6 * * 1 node /path/to/generateReport.js
```

## Future Enhancements

- [ ] User authentication and saved preferences
- [ ] Mobile app (React Native)
- [ ] Email/SMS notifications
- [ ] Dietary preference filtering
- [ ] Recipe suggestions with price optimization
- [ ] Community insights and crowdsourced prices
- [ ] Integration with loyalty programs
- [ ] Prediction models for price trends

## License

MIT

## Support

For issues or questions:
1. Check the [README](#) for setup help
2. Review API documentation for Yellowcake integration
3. Check database schema for data structure
4. Examine logs for error details

---

**Making grocery shopping affordable for everyone** 🛒
