const http = require('http');

const endpoints = [
    'http://localhost:5002/api/reports/weekly-inflation',
    'http://localhost:5002/api/reports/store-comparison?product=milk',
    'http://localhost:5002/api/reports/monthly-trend',
];

async function testEndpoint(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`✓ ${url.split('/').pop().split('?')[0]}`);
                    console.log('  Response:', JSON.stringify(json, null, 2).substring(0, 200) + '...\n');
                } catch (e) {
                    console.log(`✗ ${url.split('/').pop().split('?')[0]} - Parse error: ${e.message}\n`);
                }
                resolve();
            });
        }).on('error', err => {
            console.log(`✗ ${url.split('/').pop().split('?')[0]} - ${err.message}\n`);
            resolve();
        });
    });
}

async function run() {
    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
    process.exit(0);
}

run();
