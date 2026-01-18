import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './Chatbot.css';

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: '👋 Hi! I\'m your Deal Coach Assistant. Ask me about grocery deals, best prices, meal planning, and more!',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize session ID on mount
    useEffect(() => {
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
    }, []);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputValue.trim() || loading) return;

        // Add user message to chat
        const userMessage = {
            id: messages.length + 1,
            text: inputValue,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);

        try {
            const response = await api.post('/chatbot/message', {
                message: inputValue,
                sessionId: sessionId,
            });

            if (response.data.success) {
                const botMessage = {
                    id: messages.length + 2,
                    text: response.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botMessage]);
            } else {
                const errorMessage = {
                    id: messages.length + 2,
                    text: response.data.message || 'Sorry, something went wrong. Please try again.',
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, errorMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage = {
                id: messages.length + 2,
                text: 'Sorry, I encountered an error. Please try again later.',
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = async () => {
        try {
            await api.post('/chatbot/clear-session', { sessionId });
            setMessages([
                {
                    id: 1,
                    text: '👋 Hi! I\'m your Deal Coach Assistant. Ask me about grocery deals, best prices, meal planning, and more!',
                    sender: 'bot',
                    timestamp: new Date(),
                },
            ]);
        } catch (error) {
            console.error('Error clearing chat:', error);
        }
    };

    return (
        <>
            {/* Chatbot Widget */}
            <div className={`chatbot-widget ${isOpen ? 'open' : 'closed'}`}>
                {isOpen && (
                    <div className="chatbot-container">
                        {/* Header */}
                        <div className="chatbot-header">
                            <div className="chatbot-title">
                                <span>🤖 Deal Coach</span>
                            </div>
                            <div className="chatbot-controls">
                                <button
                                    onClick={clearChat}
                                    className="chatbot-btn-clear"
                                    title="Clear conversation"
                                >
                                    🔄
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="chatbot-btn-close"
                                    title="Close chatbot"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chatbot-messages">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`}
                                >
                                    <div className="message-content">
                                        {msg.text}
                                    </div>
                                    <div className="message-time">
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="message bot-message">
                                    <div className="message-content typing">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSendMessage} className="chatbot-input-form">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask about deals, prices, meal planning..."
                                disabled={loading}
                                className="chatbot-input"
                            />
                            <button
                                type="submit"
                                disabled={loading || !inputValue.trim()}
                                className="chatbot-send-btn"
                            >
                                {loading ? '⏳' : '➤'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`chatbot-toggle-btn ${isOpen ? 'hidden' : ''}`}
                    title="Open Deal Coach"
                >
                    💬
                </button>
            </div>
        </>
    );
}
