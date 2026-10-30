// Floating chatbot: sends questions to the Graph RAG API (chatbot-config.js) and renders the answers.
// All texts come from texte.json (chatbot.*).
document.addEventListener('DOMContentLoaded', function() {
    const chatbotMessages = document.getElementById('chatbot-messages');
    const chatbotInput = document.getElementById('chatbot-input');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotMinimize = document.getElementById('chatbot-minimize');
    const chatbotWidget = document.querySelector('.chatbot-widget');
    const suggestionButtons = document.querySelectorAll('.suggestion-btn');

    if (!chatbotMessages || !chatbotInput || !chatbotSend) return;

    const API_BASE_URL = window.CHATBOT_CONFIG ? window.CHATBOT_CONFIG.getApiUrl() : 'http://localhost:8080';
    const API_URL = `${API_BASE_URL}/chat`;

    // One conversation per browser tab
    const SESSION_ID = sessionStorage.getItem('chatbot_session_id') ||
                      `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('chatbot_session_id', SESSION_ID);

    const BOT_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/></svg>';
    const USER_ICON = '<svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>';

    function getCurrentLanguage() {
        return window.currentLanguage === 'fr' ? 'fr' : 'en';
    }

    function texts() {
        const all = window.translations && window.translations[getCurrentLanguage()];
        return (all && all.chatbot) || {};
    }

    function updateMinimizeButton() {
        const t = texts();
        const open = !chatbotWidget.classList.contains('minimized');
        chatbotMinimize.textContent = open ? '−' : '+';
        chatbotMinimize.setAttribute('aria-expanded', String(open));
        if (t.open) chatbotMinimize.setAttribute('aria-label', open ? t.close : t.open);
    }

    function updateChatbotLanguage() {
        const t = texts();
        if (!t.title) return;
        const title = document.querySelector('.chatbot-header h3');
        if (title) title.textContent = t.title;
        const welcome = document.querySelector('[data-translate="chatbot.welcome"]');
        if (welcome) welcome.textContent = t.welcome;
        chatbotInput.placeholder = t.placeholder;
        const labels = [t.suggestion1, t.suggestion2, t.suggestion3];
        suggestionButtons.forEach((btn, index) => {
            if (labels[index]) btn.textContent = labels[index];
            if (t.questions && t.questions[index]) btn.setAttribute('data-question', t.questions[index]);
        });
        updateMinimizeButton();
    }

    // languageChanged is dispatched before the page texts are updated, hence the timeout
    document.addEventListener('languageChanged', () => setTimeout(updateChatbotLanguage, 0));

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    // Light Markdown from the model (paragraphs, "*"/"-"/"•" and numbered lists, **bold**).
    // The text is escaped first: the answer is LLM output and must never be injected as HTML.
    function markdownToHtml(md) {
        let html = '', list = null;
        escapeHtml(md.trim()).split(/\n+/).forEach(line => {
            const bullet = /^\s*[*•-]\s+(.*)$/.exec(line);
            const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
            const kind = bullet ? 'ul' : numbered ? 'ol' : null;
            const content = (bullet ? bullet[1] : numbered ? numbered[1] : line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            if (list && list !== kind) { html += `</${list}>`; list = null; }
            if (kind && !list) { html += `<${kind}>`; list = kind; }
            html += kind ? `<li>${content}</li>` : `<p>${content}</p>`;
        });
        return html + (list ? `</${list}>` : '');
    }

    if (chatbotMinimize && chatbotWidget) {
        chatbotMinimize.addEventListener('click', () => {
            chatbotWidget.classList.toggle('minimized');
            updateMinimizeButton();
            if (!chatbotWidget.classList.contains('minimized')) chatbotInput.focus();
        });
    }

    function addMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${isUser ? 'user-message' : 'bot-message'}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = isUser ? USER_ICON : BOT_ICON;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        if (isUser) {
            const p = document.createElement('p');
            p.textContent = content;
            messageContent.appendChild(p);
        } else {
            messageContent.innerHTML = markdownToHtml(content);
        }

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        return messageDiv;
    }

    function addLoadingMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chatbot-message bot-message';
        messageDiv.id = 'loading-message';
        messageDiv.innerHTML = `<div class="message-avatar">${BOT_ICON}</div><div class="message-content"><div class="message-loading"><span></span><span></span><span></span></div></div>`;
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    function removeLoadingMessage() {
        const loadingMsg = document.getElementById('loading-message');
        if (loadingMsg) loadingMsg.remove();
    }

    async function sendMessage(message) {
        if (!message.trim()) return;
        const t = texts();

        addMessage(message, true);
        chatbotInput.value = '';
        chatbotSend.disabled = true;
        addLoadingMessage();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: message, session_id: SESSION_ID, language: getCurrentLanguage() })
            });
            if (response.status === 429) throw new Error('rate');
            if (!response.ok) throw new Error('http');
            const data = await response.json();
            removeLoadingMessage();
            addMessage(data.response || t.error);
        } catch (error) {
            removeLoadingMessage();
            addMessage(error.message === 'rate' ? t.rateLimited : t.error);
        } finally {
            chatbotSend.disabled = false;
            chatbotInput.focus();
        }
    }

    chatbotSend.addEventListener('click', () => sendMessage(chatbotInput.value));
    chatbotInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') sendMessage(chatbotInput.value);
    });
    suggestionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const question = btn.getAttribute('data-question');
            if (question) sendMessage(question);
        });
    });
});
