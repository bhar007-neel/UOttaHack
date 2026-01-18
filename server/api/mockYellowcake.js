/**
 * Mock Yellowcake API for development
 * Simulates real store price data without needing internet
 */

const mockProducts = {
    milk: [
        {
            title: 'Lactantia 2% Reduced Fat Milk 2L',
            price: '4.49',
            original_price: '4.99',
            availability: 'in_stock',
            unit: '2L',
            url: 'https://www.loblaws.ca/en/products/milk',
            discount: '10%',
        },
        {
            title: 'Lactantia Whole Milk 2L',
            price: '4.99',
            original_price: '5.49',
            availability: 'in_stock',
            unit: '2L',
            url: 'https://www.loblaws.ca/en/products/milk-whole',
            discount: '9%',
        },
    ],
    rice: [
        {
            title: 'Jasmine Rice 2kg',
            price: '2.99',
            original_price: '3.49',
            availability: 'in_stock',
            unit: '2kg',
            url: 'https://www.loblaws.ca/en/products/rice',
            discount: '14%',
        },
        {
            title: 'Basmati Rice 1kg',
            price: '1.99',
            original_price: '2.49',
            availability: 'in_stock',
            unit: '1kg',
            url: 'https://www.loblaws.ca/en/products/basmati-rice',
            discount: '20%',
        },
    ],
    flour: [
        {
            title: 'Robin Hood All Purpose Flour 2.5kg',
            price: '3.49',
            original_price: '3.99',
            availability: 'in_stock',
            unit: '2.5kg',
            url: 'https://www.loblaws.ca/en/products/flour',
            discount: '13%',
        },
        {
            title: 'Whole Wheat Flour 1kg',
            price: '2.49',
            original_price: '2.99',
            availability: 'in_stock',
            unit: '1kg',
            url: 'https://www.loblaws.ca/en/products/wheat-flour',
            discount: '17%',
        },
    ],
    eggs: [
        {
            title: 'Large Eggs Grade A 12 count',
            price: '2.99',
            original_price: '3.49',
            availability: 'in_stock',
            unit: '12',
            url: 'https://www.loblaws.ca/en/products/eggs',
            discount: '14%',
        },
        {
            title: 'Organic Eggs 6 count',
            price: '3.99',
            original_price: '4.49',
            availability: 'in_stock',
            unit: '6',
            url: 'https://www.loblaws.ca/en/products/organic-eggs',
            discount: '11%',
        },
    ],
};

/**
 * Mock Yellowcake API - returns simulated product listings
 */
class MockYellowcakeAPI {
    constructor() {
        this.client = null;
    }

    /**
     * Search for products on a store website (simulated)
     */
    async searchProducts(storeUrl, productName) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

        // Return mock data for the product
        const products = mockProducts[productName.toLowerCase()] || [];

        // Add some variation by store
        return products.map((p) => ({
            ...p,
            price: (parseFloat(p.price) + (Math.random() - 0.5) * 0.5).toFixed(2),
        }));
    }

    /**
     * Extract data from store pages (simulated)
     */
    async extractData(storeUrl, selectors = []) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { data: 'mock extraction' };
    }

    /**
     * Monitor a product listing (simulated)
     */
    async monitorProduct(productUrl) {
        await new Promise((resolve) => setTimeout(resolve, 400));
        return {
            title: 'Product Name',
            price: '4.99',
            availability: 'in_stock',
        };
    }

    /**
     * Get default CSS selectors
     */
    getDefaultSelectors() {
        return [
            { name: 'product_name', selector: '.product-name', type: 'text' },
            { name: 'price', selector: '.price', type: 'text' },
            { name: 'availability', selector: '.stock-status', type: 'text' },
        ];
    }

    /**
     * Batch search multiple products
     */
    async searchMultipleProducts(storeUrl, productNames) {
        const results = {};

        for (const productName of productNames) {
            try {
                results[productName] = await this.searchProducts(storeUrl, productName);
            } catch (error) {
                console.error(`Failed to search for ${productName}:`, error.message);
                results[productName] = [];
            }
        }

        return results;
    }
}

module.exports = new MockYellowcakeAPI();
