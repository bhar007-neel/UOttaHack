const axios = require('axios');
const { yellowcakeConfig } = require('../config');

class YellowcakeAPI {
    constructor() {
        this.baseUrl = 'https://api.yellowcake.dev/v1';
        this.apiKey = yellowcakeConfig.apiKey;
    }

    /**
     * Make a request to Yellowcake API with SSE stream handling
     */
    async makeRequest(url, prompt) {
        try {
            const response = await axios.post(
                `${this.baseUrl}/extract-stream`,
                { url, prompt },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.apiKey,
                    },
                    timeout: this.timeout,
                    responseType: 'stream',
                }
            );

            // Parse SSE stream to get the complete data
            const data = await this.parseSSEStream(response.data);
            return data;
        } catch (error) {
            console.error(`Yellowcake request failed for ${url}:`, error.message);
            throw error;
        }
    }

    /**
     * Parse SSE stream response
     */
    async parseSSEStream(stream) {
        return new Promise((resolve, reject) => {
            let completeData = null;
            let buffer = '';

            stream.on('data', (chunk) => {
                buffer += chunk.toString();
                const lines = buffer.split('\n');

                // Keep the last incomplete line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.slice(6);
                            const parsed = JSON.parse(jsonStr);
                            if (parsed.data) {
                                completeData = parsed.data;
                            }
                        } catch (e) {
                            // Ignore parsing errors for partial data
                        }
                    }
                }
            });

            stream.on('end', () => {
                if (completeData) {
                    resolve(completeData);
                } else {
                    reject(new Error('No data received from stream'));
                }
            });

            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
       * Search for products on a store website
       * @param {string} storeUrl - Store website URL
       * @param {string} productName - Product to search for (e.g., "milk", "rice")
       * @returns {Promise<Array>} Array of product listings
       */
    async searchProducts(storeUrl, productName) {
        try {
            const prompt = `Find product listings for "${productName}" on this store. 
For each product found, extract and return:
- product_title: the full product name/title
- product_price: the current selling price (just the number, e.g., 4.99)
- original_price: the original/regular price if on sale (optional)
- availability: in stock or out of stock status
- unit: the unit/size (e.g., "2L", "1kg", "dozen")
- discount: discount percentage if applicable
- product_url: the direct URL to this product

Return as a JSON array. Include at least 3 products if available.`;

            const results = await this.makeRequest(storeUrl, prompt);

            // Transform results to match expected format
            if (Array.isArray(results)) {
                return results.map((item) => ({
                    title: item.product_title || item.title,
                    price: item.product_price || item.price,
                    original_price: item.original_price,
                    availability: item.availability || 'unknown',
                    unit: item.unit || 'item',
                    discount: item.discount || 0,
                    url: item.product_url || storeUrl,
                }));
            }

            return [];
        } catch (error) {
            console.error(`Yellowcake search error for ${productName} at ${storeUrl}:`, error.message);
            throw error;
        }
    }

    /**
     * Extract structured data from store pages
     * @param {string} storeUrl - Store URL to extract from
     * @param {string} prompt - Custom prompt for extraction
     * @returns {Promise<Object>} Extracted data
     */
    async extractData(storeUrl, prompt) {
        try {
            const data = await this.makeRequest(storeUrl, prompt);
            return data;
        } catch (error) {
            console.error(`Yellowcake extraction error for ${storeUrl}:`, error.message);
            throw error;
        }
    }

    /**
     * Monitor a product listing for price changes
     * @param {string} productUrl - Direct product URL
     * @returns {Promise<Object>} Current product data
     */
    async monitorProduct(productUrl) {
        try {
            const prompt = `Extract the current price and availability information for this product. 
Return: product_title, product_price, original_price, availability, unit, discount percentage.`;

            const result = await this.makeRequest(productUrl, prompt);

            if (Array.isArray(result) && result.length > 0) {
                return result[0];
            }

            return result;
        } catch (error) {
            console.error(`Yellowcake monitoring error for ${productUrl}:`, error.message);
            throw error;
        }
    }

    /**
     * Batch search multiple products
     * @param {string} storeUrl - Store URL
     * @param {Array<string>} productNames - Multiple products to search
     * @returns {Promise<Object>} Results keyed by product name
     */
    async searchMultipleProducts(storeUrl, productNames) {
        const results = {};

        for (const productName of productNames) {
            try {
                console.log(`  Searching for ${productName}...`);
                results[productName] = await this.searchProducts(storeUrl, productName);
            } catch (error) {
                console.error(`Failed to search for ${productName}:`, error.message);
                results[productName] = [];
            }
        }

        return results;
    }
}

module.exports = new YellowcakeAPI();
