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
        en: { cv: 'Download CV', avail: 'Available from April 2027 · Open to relocation worldwide', skip: 'Skip to content', send: 'Send message',
              langLabel: 'Switch to French', current: 'Current', copy: 'Copy', copied: 'Copied!', menu: 'Menu',
              groups: ['Generative AI & LLMs', 'Machine Learning & Data', 'Cloud & DevOps', 'Languages & Tools'] },
        fr: { cv: 'Télécharger mon CV', avail: "Disponible à partir d'avril 2027 · Mobilité internationale", skip: 'Aller au contenu', send: 'Envoyer le message',
              langLabel: 'Passer en anglais', current: 'En cours', copy: 'Copier', copied: 'Copié !', menu: 'Menu',
              groups: ['IA générative & LLM', 'Machine Learning & Data', 'Cloud & DevOps', 'Langages & outils'] }
    };
    var SKILLS = [
        ['LLM (Ollama, Hugging Face)', 'RAG / Graph RAG', 'LangChain', 'Embeddings', 'ChromaDB', 'Neo4j vector index', 'Fine-tuning', 'RAGAS'],
        ['PyTorch', 'PyTorch Lightning', 'TensorFlow / Keras', 'Scikit-learn', 'Pandas', 'NumPy', 'NLP', 'Computer Vision (CNN)', 'Contrastive learning'],
        ['Google Cloud Run', 'Artifact Registry', 'Secret Manager', 'Cloud Monitoring', 'Terraform (IaC)', 'GitHub Actions (CI/CD)', 'Workload Identity Federation', 'Docker'],
        ['Python', 'SQL (PostgreSQL)', 'Cypher', 'C / C++', 'Java', 'Git / GitHub', 'Neo4j', 'FastAPI', 'Streamlit', 'Weights & Biases']
    ];
    // Certifications, in the order of the links in index.html: issuer monogram and skills validated (from Neo4j)
    var CERTS = [
        { mono: 'N4J', skills: ['Neo4j', 'Cypher'] },
        { mono: 'NV', skills: ['Deep Learning'] },
        { mono: 'G', skills: ['AI Fundamentals'] },
        { mono: 'G', skills: ['Web Analytics'] }
    ];
    function lang() {
        var l = window.currentLanguage;
        try { l = l || localStorage.getItem('language'); } catch (e) {}
        if (!l) l = (navigator.language || '').slice(0, 2) === 'fr' ? 'fr' : 'en';
        return l === 'fr' ? 'fr' : 'en';
    }
    function $(s, r) { return (r || document).querySelector(s); }
    function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

    function buildSkills() {
        var host = $('#skills .container'), net = $('.certifications-section');
        if (!host || !net) return;
        var wrap = document.createElement('div'); wrap.className = 'skills-chips';
        SKILLS.forEach(function (items, i) {
            var g = document.createElement('div'); g.className = 'skills-group';
            g.innerHTML = '<h3 data-group="' + i + '"></h3><ul>' + items.map(function (x) { return '<li>' + x.replace('&', '&amp;') + '</li>'; }).join('') + '</ul>';
            wrap.appendChild(g);
        });
        host.insertBefore(wrap, net);
    }

    // Rebuild the plain certification links as badges (the links stay the fallback without JS)
    function renderCerts() {
        var tr = window.translations && window.translations[lang()];
        var list = $('.certification-list');
        if (!tr || !list) return;
        if (!list.dataset.urls) list.dataset.urls = $$('a', list).map(function (a) { return a.href; }).join(' ');
        var urls = list.dataset.urls.split(' ');
        list.className = 'certification-list cert-grid';
        list.innerHTML = '';
        tr.skills.certifications.forEach(function (c, i) {
            var li = document.createElement('li'); li.className = 'cert';
            var seal = document.createElement('span'); seal.className = 'cert-seal'; seal.setAttribute('aria-hidden', 'true'); seal.textContent = CERTS[i].mono;
            var body = document.createElement('div'); body.className = 'cert-body';
            var issuer = document.createElement('p'); issuer.className = 'cert-issuer'; issuer.textContent = c.issuer;
            var name = document.createElement('p'); name.className = 'cert-name'; name.textContent = c.name;
            var skills = document.createElement('ul'); skills.className = 'cert-skills';
            CERTS[i].skills.forEach(function (s) { var x = document.createElement('li'); x.textContent = s; skills.appendChild(x); });
            var link = document.createElement('a'); link.className = 'project-link cert-link'; link.href = urls[i];
            link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = tr.skills.certLink;
            link.setAttribute('aria-label', tr.skills.certLink + ' : ' + c.name);
            body.appendChild(issuer); body.appendChild(name); body.appendChild(skills); body.appendChild(link);
            li.appendChild(seal); li.appendChild(body); list.appendChild(li);
        });
        var count = $('.cert-count');
        if (!count) { count = document.createElement('p'); count.className = 'cert-count'; $('.certifications-section .subsection-title').after(count); }
        count.textContent = tr.skills.certCount.replace('{n}', tr.skills.certifications.length);
    }

    function buildMisc() {
        var first = $('.timeline-item .tl-header');
        if (first) { var b = document.createElement('span'); b.className = 'tl-badge'; first.appendChild(b); }
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
        var cs = $('#chatbot-send'); if (cs) cs.setAttribute('aria-label', t.send);
        $$('.skills-group h3').forEach(function (h) { h.textContent = t.groups[+h.dataset.group]; });
        var tb = $('.tl-badge'); if (tb) tb.textContent = t.current;
        renderCerts();
        var cp = $('.copy-email'); if (cp) { cp.textContent = t.copy; cp.setAttribute('aria-label', t.copy + ' email'); }
    }

    function wakeChatbot() {
        try {
            var url = window.CHATBOT_CONFIG && window.CHATBOT_CONFIG.getApiUrl();
            if (url) fetch(url, { mode: 'no-cors' }).catch(function () {});
        } catch (e) {}
    }

    document.addEventListener('DOMContentLoaded', function () {
        buildSkills(); buildMisc(); apply();
        document.addEventListener('languageChanged', function () { setTimeout(apply, 0); });
        window.addEventListener('load', function () { setTimeout(wakeChatbot, 1200); });
    });
})();
