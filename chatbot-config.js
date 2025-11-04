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
        // Force production URL for testing
        // Comment out the next line to re-enable auto-detection
        return this.API_URLS.PRODUCTION;
        
        const isLocal = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:';
        
        return isLocal ? this.API_URLS.LOCAL : this.API_URLS.PRODUCTION;
    }
};

// Export for use in chatbot-client.js
window.CHATBOT_CONFIG = CHATBOT_CONFIG;
