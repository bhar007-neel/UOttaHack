const express = require('express');
const chatbotService = require('../services/chatbotService');

const router = express.Router();

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post('/message', async (req, res) => {
    try {
        const { message, sessionId } = req.body;

        // Validate input
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid message. Please provide a non-empty message.',
            });
        }

        // Generate session ID if not provided
        const newSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Get response from chatbot
        const response = await chatbotService.chat(message.trim(), newSessionId);

        res.json(response);
    } catch (error) {
        console.error('Chatbot route error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing your message.',
            error: error.message,
        });
    }
});

/**
 * POST /api/chatbot/clear-session
 * Clear conversation history for a session
 */
router.post('/clear-session', (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID required.',
            });
        }

        chatbotService.clearSession(sessionId);
        res.json({
            success: true,
            message: 'Session cleared.',
        });
    } catch (error) {
        console.error('Clear session error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing session.',
            error: error.message,
        });
    }
});

module.exports = router;
