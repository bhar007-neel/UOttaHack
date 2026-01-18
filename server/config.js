require('dotenv').config();

const port = process.env.PORT || 5002;
const nodeEnv = process.env.NODE_ENV || 'development';

const yellowcakeConfig = {
    apiKey: process.env.YELLOWCAKE_API_KEY,
    baseUrl: 'https://api.yellowcake.dev/v1',
    timeout: 300000, // 5 minutes for Yellowcake since it can take a while
};

const dbConfig = {
    path: process.env.DB_PATH || './data/food-prices.db',
};

const alertConfig = {
    enabled: process.env.ENABLE_PRICE_ALERTS === 'true',
    priceSpikethreshold: parseInt(process.env.ALERT_PRICE_SPIKE_THRESHOLD || '15'),
    collectionIntervalMinutes: parseInt(process.env.COLLECTION_INTERVAL_MINUTES || '360'),
};

const trackedStores = (process.env.TRACKED_STORES || 'store1,store2,store3').split(',');
const trackedProducts = (process.env.TRACKED_PRODUCTS || 'milk,rice,flour,eggs').split(',');

module.exports = {
    port,
    nodeEnv,
    yellowcakeConfig,
    dbConfig,
    alertConfig,
    trackedStores,
    trackedProducts,
};
