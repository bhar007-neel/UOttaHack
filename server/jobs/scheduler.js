/**
 * Price collection scheduler using node-cron
 * Automatically collects prices every 6 hours
 */

require('dotenv').config();
const cron = require('node-cron');
const { spawn } = require('child_process');
const { alertConfig } = require('../config');

// Schedule price collection every 6 hours (0 2 8 14 20)
// Default: every 6 hours
const collectionInterval = process.env.COLLECTION_INTERVAL_MINUTES || '360'; // 360 mins = 6 hours

console.log(`🚀 Price Collection Scheduler started`);
console.log(`⏱️  Collection interval: ${collectionInterval} minutes\n`);

// Convert minutes to cron schedule
// For 360 minutes (6 hours), run at: 0, 6, 12, 18 UTC
const scheduleCron = '0 */6 * * *'; // Every 6 hours

cron.schedule(scheduleCron, () => {
    console.log(`\n[${new Date().toISOString()}] ⏰ Starting scheduled price collection...`);

    const collector = spawn('node', ['server/jobs/collectPrices.js'], {
        cwd: __dirname + '/../..',
    });

    collector.stdout.on('data', (data) => {
        console.log(data.toString());
    });

    collector.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    collector.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ Price collection completed successfully`);
        } else {
            console.error(`❌ Price collection failed with code ${code}`);
        }
    });
});

// Also run once immediately when the scheduler starts
console.log(`\n[${new Date().toISOString()}] 🔄 Running initial price collection...`);

const initialCollector = spawn('node', ['server/jobs/collectPrices.js'], {
    cwd: __dirname + '/../..',
});

initialCollector.stdout.on('data', (data) => {
    console.log(data.toString());
});

initialCollector.stderr.on('data', (data) => {
    console.error(data.toString());
});

// Keep the process running
process.on('SIGINT', () => {
    console.log('\n\n👋 Scheduler shutting down...');
    process.exit(0);
});

console.log('\n📊 Scheduler is running. Next collection scheduled...');
