# Food Price Dashboard

Track daily grocery prices and availability across stores to help low-income households find the best deals on essentials.

## Features

- 🛒 **Price Tracking**: Monitor prices for staple foods (milk, rice, flour, eggs) across multiple grocery stores
- 📊 **Price History**: Track trends over time to identify seasonal patterns
- 🚨 **Price Alerts**: Get notifications when prices spike above your threshold
- 📈 **Inflation Reports**: Weekly reports on price changes for essentials
- 💰 **Cheapest Store Finder**: Daily recommendations for where to shop
- 📍 **Stock Status**: Track availability and out-of-stock alerts
- 📱 **Responsive Dashboard**: View prices on desktop or mobile

## Tech Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: SQLite (or PostgreSQL)
- **API Integration**: Yellowcake API for web scraping and data extraction
- **Scheduler**: Node-cron for scheduled price collection

## Project Structure

```
.
├── server/                 # Backend API
│   ├── index.js           # Express server entry
│   ├── config.js          # Configuration
│   ├── api/
│   │   ├── yellowcake.js  # Yellowcake API integration
│   │   └── prices.js      # Price endpoints
│   ├── services/
│   │   ├── priceNormalizer.js
│   │   ├── alertManager.js
│   │   └── reportGenerator.js
│   ├── jobs/
│   │   ├── collectPrices.js
│   │   └── generateReport.js
│   ├── db/
│   │   ├── schema.sql
│   │   └── init.js
│   └── migrations/
├── client/                # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.tsx
│   └── public/
├── data/                  # Local SQLite database
└── docs/                  # Documentation
```

## Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and add your Yellowcake API key
3. Install dependencies: `npm install`
4. Initialize database: `npm run db:migrate`
5. Start development server: `npm run dev`

## API Endpoints

### Prices
- `GET /api/prices/current` - Get current prices for all products
- `GET /api/prices/cheapest` - Get cheapest store for each product
- `GET /api/prices/history/:productId` - Get price history
- `GET /api/prices/store/:storeId` - Get all prices at a store

### Alerts
- `GET /api/alerts` - Get recent price spike alerts
- `POST /api/alerts/subscribe` - Subscribe to alerts
- `DELETE /api/alerts/:id` - Dismiss alert

### Reports
- `GET /api/reports/weekly-inflation` - Get weekly inflation report
- `GET /api/reports/store-comparison` - Compare prices across stores

## Data Collection

The system automatically collects prices every 6 hours using the Yellowcake API:

1. Query grocery store websites for product listings
2. Extract prices, discounts, and availability
3. Normalize units (e.g., convert to $/kg)
4. Store in database with timestamp
5. Check for price spikes and trigger alerts

## Low-Income Household Benefits

- ✅ Save money by finding cheapest options
- ✅ Plan shopping trips across multiple stores
- ✅ Get warned before price spikes hit
- ✅ Understand inflation impact on food budget
- ✅ Track best buying times (weekly/seasonal patterns)

## License

MIT
