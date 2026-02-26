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
            title: "Ask me anything!",
            welcome: "Hi! I'm Léon's AI assistant. Ask me anything about his experience, skills, or projects!\n\nNote: The first response may take a bit longer as the servers wake up.",
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
            title: "Posez-moi vos questions !",
            welcome: "Bonjour ! Je suis l'assistant IA de Léon. Posez-moi des questions sur son expérience, ses compétences ou ses projets !\n\nNote : La première réponse peut prendre un peu plus de temps, le temps que les serveurs redémarrent.",
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
        
        // Update title
        const chatbotTitle = document.querySelector('.chatbot-header h3');
        if (chatbotTitle) {
            chatbotTitle.textContent = t.title;
        }
        
        // Update welcome message
        const welcomeMessage = document.querySelector('.chatbot-message.bot-message .message-content p');
        if (welcomeMessage) {
            // Replace \n with <br> for HTML
            welcomeMessage.innerHTML = t.welcome.replace(/\n/g, '<br>');
        }
        
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
    
    // Function to convert Markdown to HTML
    function markdownToHtml(text) {
        // Replace **bold** with <strong>
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Replace bullet points (• or -) with <li>
        text = text.replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>');
        
        // Wrap consecutive <li> in <ul>
        text = text.replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>');
        
        // Replace numbered lists (1., 2., etc.)
        text = text.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');
        
        // Replace Markdown tables
        const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
        text = text.replace(tableRegex, function(match, header, rows) {
            // Process header
            const headerCells = header.split('|').filter(cell => cell.trim()).map(cell => 
                `<th>${cell.trim()}</th>`
            ).join('');
            
            // Process rows
            const rowsHtml = rows.trim().split('\n').map(row => {
                const cells = row.split('|').filter(cell => cell.trim()).map(cell => 
                    `<td>${cell.trim()}</td>`
                ).join('');
                return `<tr>${cells}</tr>`;
            }).join('');
            
            return `<table class="chatbot-table"><thead><tr>${headerCells}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
        });
        
        // Replace line breaks with <br>
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
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
        
        // Use professional icons instead of emojis
        if (isUser) {
            avatar.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';
        } else {
            avatar.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>';
        }
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messagePara = document.createElement('p');
        
        // For bot messages, convert markdown to HTML
        if (!isUser) {
            messagePara.innerHTML = markdownToHtml(content);
        } else {
            messagePara.textContent = content;
        }
        
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
        avatar.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>';
        
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
