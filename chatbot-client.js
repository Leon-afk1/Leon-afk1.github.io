// Chatbot Functionality
document.addEventListener('DOMContentLoaded', function() {
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMinimize = document.getElementById('chatbot-minimize');
    const chatbotWidget = document.querySelector('.chatbot-widget');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');
    
    if (!chatbotMessages || !chatbotInput || !chatbotSend) return;
    
    // API Configuration - Uses config file or falls back to auto-detection
    const API_BASE_URL = window.CHATBOT_CONFIG ? window.CHATBOT_CONFIG.getApiUrl() : 'http://localhost:8080';
    const API_URL = `${API_BASE_URL}/chat`;
    
    // Generate unique session ID for this browser session
    const SESSION_ID = sessionStorage.getItem('chatbot_session_id') || 
                      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chatbot_session_id', SESSION_ID);
    
    console.log('🤖 Chatbot API URL:', API_URL);
    console.log('🔑 Session ID:', SESSION_ID);
    
    // Chatbot translations
    const chatbotTranslations = {
        en: {
            inputPlaceholder: "Ask me anything about Léon...",
            sendButton: "Send",
            errorMessage: "Sorry, I'm having trouble connecting to the server. Please try again later.",
            suggestions: [
                "What are your main skills?",
                "Tell me about your projects",
                "What is your experience?"
            ]
        },
        fr: {
            inputPlaceholder: "Posez-moi une question sur Léon...",
            sendButton: "Envoyer",
            errorMessage: "Désolé, j'ai des difficultés à me connecter au serveur. Veuillez réessayer plus tard.",
            suggestions: [
                "Quelles sont tes compétences principales ?",
                "Parle-moi de tes projets",
                "Quelle est ton expérience ?"
            ]
        }
    };
    
    // Function to get current language from main site
    function getCurrentLanguage() {
        return window.currentLanguage || 'en';
    }
    
    // Function to update chatbot UI language
    function updateChatbotLanguage() {
        const lang = getCurrentLanguage();
        const t = chatbotTranslations[lang] || chatbotTranslations.en;
        
        // Update placeholder
        if (chatbotInput) {
            chatbotInput.placeholder = t.inputPlaceholder;
        }
        
        // Update suggestion buttons
        suggestionButtons.forEach((btn, index) => {
            if (t.suggestions[index]) {
                btn.textContent = t.suggestions[index];
                btn.setAttribute('data-question', t.suggestions[index]);
            }
        });
    }
    
    // Update language on page load
    updateChatbotLanguage();
    
    // Listen for language changes from main site
    document.addEventListener('languageChanged', updateChatbotLanguage);
    
    // Minimize/Maximize chatbot
    if (chatbotMinimize && chatbotWidget) {
        chatbotMinimize.addEventListener('click', () => {
            chatbotWidget.classList.toggle('minimized');
            chatbotMinimize.textContent = chatbotWidget.classList.contains('minimized') ? '+' : '−';
        });
    }
    
    // Add message to chat
    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = isUser ? '👤' : '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messagePara = document.createElement('p');
        messagePara.textContent = content;
        
        messageContent.appendChild(messagePara);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        
        return messageDiv;
    }
    
    // Add loading indicator
    function addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot-message';
        messageDiv.id = 'loading-message';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = '🤖';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message-loading';
        loadingDiv.innerHTML = '<span></span><span></span><span></span>';
        
        messageContent.appendChild(loadingDiv);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        
        return messageDiv;
    }
    
    // Remove loading indicator
    function removeLoadingMessage() {
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) {
            loadingMsg.remove();
        }
    }
    
    // Send message to API
    async function sendMessage(message) {
        if (!message.trim()) return;
        
        const lang = getCurrentLanguage();
        const t = chatbotTranslations[lang] || chatbotTranslations.en;
        
        // Add user message
        addMessage(message, true);
        chatbotInput.value = '';
        chatbotSend.disabled = true;
        
        // Add loading indicator
        const loadingMsg = addLoadingMessage();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    query: message,
                    session_id: SESSION_ID,
                    language: lang
                })
            });
            
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            
            // Remove loading and add bot response
            removeLoadingMessage();
            addMessage(data.response || t.errorMessage);
            
        } catch (error) {
            console.error('Error:', error);
            removeLoadingMessage();
            addMessage(t.errorMessage);
        } finally {
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    }
    
    // Send button click
    chatbotSend.addEventListener('click', () => {
        sendMessage(chatbotInput.value);
    });
    
    // Enter key to send
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage(chatbotInput.value);
        }
    });
    
    // Suggestion buttons
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            if (question) {
                chatbotInput.value = question;
                sendMessage(question);
            }
        });
    });
});
