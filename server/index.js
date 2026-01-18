const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { port, nodeEnv } = require('./config');
const db = require('./db/init');
const priceRoutes = require('./routes/prices');
const alertRoutes = require('./routes/alerts');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const scraperRoutes = require('./routes/scraper');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize database
db.initialize().catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});

// Routes
app.use('/api/prices', priceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/scraper', scraperRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`🚀 BargainBasket API running on port ${port} (${nodeEnv})`);
});
