(function () {
    'use strict';
    var ORT_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.17.3/dist/ort.min.js';
    var ortPromise = null;
    window.loadOrt = function () {
        if (window.ort) return Promise.resolve(window.ort);
        if (!ortPromise) {
            ortPromise = new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = ORT_URL;
                s.onload = function () { resolve(window.ort); };
                s.onerror = function () { ortPromise = null; reject(new Error('ONNX Runtime failed to load')); };
                document.head.appendChild(s);
            });
        }
        return ortPromise;
    };

    var CV = { en: 'CV_Leon_Morales_AI_2027_English.pdf', fr: 'CV_Leon_Morales_IA_2027_Francais.pdf' };
    var T = {
        en: { cv: 'Download CV', avail: 'Available from April 2027 · Open to relocation worldwide', skip: 'Skip to content', filtersLabel: 'Filter projects', send: 'Send message',
              langLabel: 'Switch to French', current: 'Current', copy: 'Copy', copied: 'Copied!', menu: 'Menu',
              filters: { all: 'All', llm: 'LLM & RAG', vision: 'Vision', research: 'Research', ml: 'ML & Data' },
              groups: ['Generative AI & LLMs', 'Machine Learning & Data', 'Languages & Tools'] },
        fr: { cv: 'Télécharger mon CV', avail: "Disponible à partir d'avril 2027 · Mobilité internationale", skip: 'Aller au contenu', filtersLabel: 'Filtrer les projets', send: 'Envoyer le message',
              langLabel: 'Passer en anglais', current: 'En cours', copy: 'Copier', copied: 'Copié !', menu: 'Menu',
              filters: { all: 'Tous', llm: 'LLM & RAG', vision: 'Vision', research: 'Recherche', ml: 'ML & Data' },
              groups: ['IA générative & LLM', 'Machine Learning & Data', 'Langages & outils'] }
    };
    var SKILLS = [
        ['LLM (Ollama, Hugging Face)', 'RAG / Graph RAG', 'LangChain', 'Embeddings', 'ChromaDB', 'Neo4j vector index', 'Fine-tuning', 'RAGAS'],
        ['PyTorch', 'PyTorch Lightning', 'TensorFlow / Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'NLP', 'Computer Vision (CNN)', 'Contrastive learning'],
        ['Python', 'SQL (PostgreSQL)', 'Cypher', 'C / C++', 'Java', 'Git / GitHub', 'Docker', 'Neo4j', 'FastAPI', 'Streamlit', 'Google Cloud Run', 'Terraform', 'GitHub Actions', 'Weights & Biases']
    ];
    var CATS = [['Graph RAG Assistant', 'llm'], ['Human Activity', 'research'], ['LLM-based Chatbot', 'llm'], ['Intelligent RAG', 'llm'], ['AgroScan', 'vision'],
        ["Parkinson", 'ml'], ['Drug Analysis', 'research'], ['UQAC Handbook', 'llm'], ['Cell Classification', 'vision'],
        ['Mushroom', 'ml'], ['Poultry', 'vision'], ['MNIST', 'vision'], ['Music Genre', 'ml'], ['Tangram', 'ml']];

    function lang() {
        var l = window.currentLanguage;
        try { l = l || localStorage.getItem('language'); } catch (e) {}
        if (!l) l = (navigator.language || '').slice(0, 2) === 'fr' ? 'fr' : 'en';
        return l === 'fr' ? 'fr' : 'en';
    }
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    function buildSkills() {
        var host = $('.neural-skills .container'), net = $('.neural-network-container');
        if (!host || !net) return;
        var wrap = document.createElement('div'); wrap.className = 'skills-chips';
        SKILLS.forEach(function (items, i) {
            var g = document.createElement('div'); g.className = 'skills-group';
            g.innerHTML = '<h3 data-group="' + i + '"></h3><ul>' + items.map(function (x) { return '<li>' + x.replace('&', '&amp;') + '</li>'; }).join('') + '</ul>';
            wrap.appendChild(g);
        });
        host.insertBefore(wrap, net);
    }

    var activeFilter = 'all';
    function buildProjects() {
        var cards = $$('.project-card');
        cards.forEach(function (card) {
            var title = ($('h3', card) || {}).textContent || '';
            var m = CATS.filter(function (c) { return title.indexOf(c[0]) !== -1; })[0];
            card.dataset.cat = m ? m[1] : 'ml';
            var tags = $$('.project-tags .tag', card);
            if (tags.length > 4) {
                tags.slice(4).forEach(function (t) { t.hidden = true; });
                var more = document.createElement('span'); more.className = 'tag tag-more'; more.textContent = '+' + (tags.length - 4);
                more.title = tags.slice(4).map(function (t) { return t.textContent; }).join(', ');
                tags[0].parentNode.appendChild(more);
            }
        });
        var anchor = $('.featured-projects'); if (!anchor) return;
        var bar = document.createElement('div'); bar.className = 'project-filters'; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', 'Filter projects');
        ['all', 'llm', 'vision', 'research', 'ml'].forEach(function (k) {
            var b = document.createElement('button'); b.type = 'button'; b.className = 'filter-btn'; b.dataset.filter = k;
            b.setAttribute('aria-pressed', k === 'all' ? 'true' : 'false');
            b.addEventListener('click', function () { activeFilter = k; applyFilter(); });
            bar.appendChild(b);
        });
        anchor.parentNode.insertBefore(bar, anchor);
    }
    function applyFilter() {
        $$('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === activeFilter)); });
        $$('.project-card').forEach(function (c) { c.hidden = activeFilter !== 'all' && c.dataset.cat !== activeFilter; });
        var fl = $('.fp-list'), gr = $('.projects-grid');
        var fv = fl && $$('.project-card', fl).some(function (c) { return !c.hidden; });
        var gv = gr && $$('.project-card', gr).some(function (c) { return !c.hidden; });
        var fh = $('.featured-projects .fp-header'), mh = $('.more-projects-header');
        if (fl) fl.hidden = !fv; if (fh) fh.hidden = !fv;
        if (gr) gr.hidden = !gv; if (mh) mh.hidden = !gv;
    }

    function buildMisc() {
        var first = $('.timeline-item .tl-header');
        if (first) { var b = document.createElement('span'); b.className = 'tl-badge'; first.querySelector('h3').appendChild(b); }
        var mail = $('.contact-method[href^="mailto:"]');
        if (mail && navigator.clipboard) {
            var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'copy-email';
            btn.addEventListener('click', function () {
                navigator.clipboard.writeText('leon.morales@outlook.fr').then(function () {
                    btn.textContent = T[lang()].copied; setTimeout(apply, 1500);
                });
            });
            mail.insertAdjacentElement('afterend', btn);
        }
        var nt = $('.nav-toggle');
        if (nt) new MutationObserver(function () { nt.setAttribute('aria-expanded', String(nt.classList.contains('active'))); })
            .observe(nt, { attributes: true, attributeFilter: ['class'] });
    }

    function apply() {
        var l = lang(), t = T[l];
        document.documentElement.lang = l;
        $$('#cv-download, #cv-download-contact').forEach(function (a) {
            a.href = CV[l]; var s = $('span', a); (s || a).textContent = t.cv;
        });
        var av = $('#availability-text'); if (av) av.textContent = t.avail;
        var sk = $('.skip-link'); if (sk) sk.textContent = t.skip;
        var lt = $('#language-toggle'); if (lt) lt.setAttribute('aria-label', t.langLabel);
        var nt = $('.nav-toggle'); if (nt) nt.setAttribute('aria-label', t.menu);
        $$('.filter-btn').forEach(function (b) { b.textContent = t.filters[b.dataset.filter]; });
        var fb = $('.project-filters'); if (fb) fb.setAttribute('aria-label', t.filtersLabel);
        var cs = $('#chatbot-send'); if (cs) cs.setAttribute('aria-label', t.send);
        $$('.skills-group h3').forEach(function (h) { h.textContent = t.groups[+h.dataset.group]; });
        var tb = $('.tl-badge'); if (tb) tb.textContent = t.current;
        var cp = $('.copy-email'); if (cp) { cp.textContent = t.copy; cp.setAttribute('aria-label', t.copy + ' email'); }
    }

    function wakeChatbot() {
        try {
            var url = window.CHATBOT_CONFIG && window.CHATBOT_CONFIG.getApiUrl();
            if (url) fetch(url, { mode: 'no-cors' }).catch(function () {});
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
        buildSkills(); buildProjects(); buildMisc(); apply();
        document.addEventListener('languageChanged', function () { setTimeout(apply, 0); });
        window.addEventListener('load', function () { setTimeout(wakeChatbot, 1200); });
    });
})();
