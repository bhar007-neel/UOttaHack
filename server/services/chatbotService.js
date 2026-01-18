const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db/init');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemPrompt = `You are a friendly and helpful "Deal Coach Assistant" for a food price dashboard. Your role is to help users find the best grocery deals, compare prices, plan meals, and save money on groceries.

You have access to real-time grocery price data from our database. When users ask about prices, use the information provided to give them accurate, current pricing.

When users ask about:
- Specific product prices: Look at the price data provided and give them the cheapest option and where to buy it
- Grocery deals: Provide helpful tips about finding deals at different stores using our real data
- Best prices: Compare prices across stores and recommend the best deals
- Meal planning: Give suggestions for affordable meal ideas based on current deals
- Budget tips: Provide money-saving strategies for grocery shopping

Be conversational, friendly, and practical. Always reference real pricing from our database when available. Encourage users to check the app for updated prices.

Keep responses concise and helpful.`;

class ChatbotService {
    constructor() {
        this.conversationHistory = new Map();
        this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    }

    // Get current prices for all products
    async getCurrentPrices() {
        return new Promise((resolve, reject) => {
            db.db.all(
                `SELECT DISTINCT 
                  productName,
                  storeName,
                  price,
                  normalizedPrice,
                  discount,
                  availability,
                  timestamp
                 FROM prices
                 WHERE timestamp = (
                   SELECT MAX(timestamp) FROM prices p2 
                   WHERE p2.productName = prices.productName 
                   AND p2.storeName = prices.storeName
                 )
                 ORDER BY productName, price ASC`,
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Get cheapest prices for today
    async getCheapestPrices() {
        return new Promise((resolve, reject) => {
            const today = new Date().toISOString().split('T')[0];
            db.db.all(
                `SELECT 
                  productName,
                  storeName,
                  price,
                  discount,
                  availability
                 FROM prices
                 WHERE DATE(timestamp) = ?
                 AND price = (
                   SELECT MIN(price) FROM prices p2
                   WHERE p2.productName = prices.productName
                   AND DATE(p2.timestamp) = ?
                 )
                 ORDER BY productName`,
                [today, today],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Get what products user can afford with their budget
    async getAffordableProducts(budget) {
        return new Promise((resolve, reject) => {
            const today = new Date().toISOString().split('T')[0];
            db.db.all(
                `SELECT 
                  productName,
                  storeName,
                  price,
                  discount,
                  availability
                 FROM prices
                 WHERE DATE(timestamp) = ?
                 AND price <= ?
                 AND price = (
                   SELECT MIN(price) FROM prices p2
                   WHERE p2.productName = prices.productName
                   AND DATE(p2.timestamp) = ?
                 )
                 ORDER BY productName, price ASC`,
                [today, budget, today],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                }
            );
        });
    }

    // Extract budget from user message (e.g., "$50", "50 dollars", "i have 50")
    extractBudget(message) {
        const patterns = [
            /\$(\d+(?:\.\d{1,2})?)/i,                        // $50, $50.99
            /(\d+(?:\.\d{1,2})?)\s*dollars?/i,              // 50 dollars, 50 dollar
            /i\s+have\s+\$?(\d+(?:\.\d{1,2})?)/i,           // i have 50, i have $50
            /budget\s+(?:of\s+)?\$?(\d+(?:\.\d{1,2})?)/i,   // budget of 50, budget $50
            /(\d+(?:\.\d{1,2})?)\s*(?:dollars?|bucks)/i,    // 50 bucks, 50 dollars
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return parseFloat(match[1]);
            }
        }
        return null;
    }

    // Format affordable products for display
    formatAffordableProducts(products, budget) {
        if (!products || products.length === 0) {
            return `Unfortunately, with a budget of $${budget.toFixed(2)}, you cannot afford any products right now. The cheapest items available are more expensive.`;
        }

        let formattedText = `Great! With a budget of $${budget.toFixed(2)}, here's what you can buy:\n\n`;
        let totalSpent = 0;

        products.forEach((product) => {
            const status = product.availability === 'in_stock' ? '✓' : '✗';
            formattedText += `• ${product.productName} - $${product.price.toFixed(2)} at ${product.storeName} ${status}\n`;
            totalSpent += product.price;
        });

        formattedText += `\nTotal cost if you buy one of each: $${totalSpent.toFixed(2)}\n`;
        formattedText += `You can comfortably afford ${products.length} different product(s) with your budget!`;

        return formattedText;
    }

    // Format prices for display
    formatPriceData(prices) {
        if (!prices || prices.length === 0) {
            return 'No price data available.';
        }

        let formattedText = '';
        const groupedByProduct = {};

        prices.forEach((price) => {
            if (!groupedByProduct[price.productName]) {
                groupedByProduct[price.productName] = [];
            }
            groupedByProduct[price.productName].push(price);
        });

        Object.entries(groupedByProduct).forEach(([product, priceList]) => {
            formattedText += `\n${product}:\n`;
            priceList.forEach((p) => {
                const discount = p.discount > 0 ? ` (${p.discount}% OFF)` : '';
                const status = p.availability === 'in_stock' ? '✓ In Stock' : '✗ Out of Stock';
                formattedText += `  - $${p.price.toFixed(2)} at ${p.storeName}${discount} - ${status}\n`;
            });
        });

        return formattedText;
    }

    async chat(message, sessionId) {
        try {
            // Get real-time price data if user asks about prices
            let priceContext = '';
            const lowerMessage = message.toLowerCase();

            // Check if user is asking about budget
            const budget = this.extractBudget(message);
            if (budget && (lowerMessage.includes('budget') || lowerMessage.includes('have') || lowerMessage.includes('spend'))) {
                try {
                    const affordableProducts = await this.getAffordableProducts(budget);
                    priceContext = `\n\nUser's Budget Information:\n${this.formatAffordableProducts(affordableProducts, budget)}`;
                } catch (budgetErr) {
                    console.error('Error fetching affordable products:', budgetErr);
                }
            }
            // Check if asking about prices
            else if (
                lowerMessage.includes('price') ||
                lowerMessage.includes('deal') ||
                lowerMessage.includes('cheapest') ||
                lowerMessage.includes('cost') ||
                lowerMessage.includes('how much')
            ) {
                try {
                    const cheapestPrices = await this.getCheapestPrices();
                    if (cheapestPrices.length > 0) {
                        priceContext = `\n\nCurrent best prices today:\n${this.formatPriceData(cheapestPrices)}`;
                    }
                } catch (priceErr) {
                    console.error('Error fetching prices:', priceErr);
                }
            }

            // Initialize or get chat session
            if (!this.conversationHistory.has(sessionId)) {
                this.conversationHistory.set(sessionId, {
                    history: [],
                    startTime: Date.now(),
                });
            }

            const session = this.conversationHistory.get(sessionId);

            // Add system prompt and user message to history
            const fullHistory = [
                { role: 'user', parts: [{ text: systemPrompt }] },
                { role: 'model', parts: [{ text: 'I understand. I will act as your Deal Coach Assistant with access to real-time pricing data.' }] },
                ...session.history,
                { role: 'user', parts: [{ text: message + priceContext }] },
            ];

            // Create a chat session with the model
            const chat = this.model.startChat({
                history: fullHistory.slice(0, -1),
                generationConfig: {
                    maxOutputTokens: 512,
                    temperature: 0.7,
                },
            });

            // Send the message and get response
            const result = await chat.sendMessage(message + priceContext);
            const responseText = result.response.text();

            // Add to conversation history
            session.history.push({
                role: 'user',
                parts: [{ text: message }],
            });
            session.history.push({
                role: 'model',
                parts: [{ text: responseText }],
            });

            // Keep history size manageable
            if (session.history.length > 20) {
                session.history = session.history.slice(-20);
            }

            this.cleanupOldSessions();

            return {
                success: true,
                message: responseText,
                sessionId: sessionId,
            };
        } catch (error) {
            console.error('Chatbot error:', error.message);
            return {
                success: false,
                message: 'Sorry, I encountered an issue. Please try again.',
                error: error.message,
            };
        }
    }

    cleanupOldSessions() {
        const oneHourMs = 60 * 60 * 1000;
        const now = Date.now();

        for (const [sessionId, session] of this.conversationHistory.entries()) {
            if (now - session.startTime > oneHourMs) {
                this.conversationHistory.delete(sessionId);
            }
        }
    }

    clearSession(sessionId) {
        this.conversationHistory.delete(sessionId);
    }
}

module.exports = new ChatbotService();
