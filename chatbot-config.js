// Configuration file for the chatbot
// Update this file with your Hugging Face Space URL

const CHATBOT_CONFIG = {
    // Backend API URLs
    API_URLS: {
        // Use this for local development
        LOCAL: 'http://localhost:8080',
        
        // REPLACE THIS with your Hugging Face Space URL
        // Format: https://your-username-space-name.hf.space
        PRODUCTION: 'https://leon-mls-chatbot-portfolio.hf.space'
    },
    
    // Auto-detect environment
    getApiUrl: function() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal && window.location.search.includes('localapi') ? this.API_URLS.LOCAL : this.API_URLS.PRODUCTION;
    }
};

// Export for use in chatbot-client.js
window.CHATBOT_CONFIG = CHATBOT_CONFIG;
