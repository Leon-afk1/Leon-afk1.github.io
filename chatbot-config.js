// Configuration file for the chatbot

const CHATBOT_CONFIG = {
    // Backend API URLs
    API_URLS: {
        // Use this for local development
        LOCAL: 'http://localhost:8080',

        // Cloud Run service (terraform output service_url, see infra/README.md)
        PRODUCTION: 'https://portfolio-chatbot-ls5myalnna-ew.a.run.app'
    },
    
    // Auto-detect environment
    getApiUrl: function() {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        return isLocal && window.location.search.includes('localapi') ? this.API_URLS.LOCAL : this.API_URLS.PRODUCTION;
    }
};

// Export for use in chatbot-client.js
window.CHATBOT_CONFIG = CHATBOT_CONFIG;
