// Language system: loads texte.json, applies the static texts of the page, and dispatches
// "languageChanged" so the other scripts (projects, timeline, graphs, chatbot...) render their own parts.
// Exposes window.translations and window.currentLanguage.
(function () {
    'use strict';

    window.currentLanguage = 'en';
    window.translations = {};

    function $(selector) { return document.querySelector(selector); }

    function setText(selector, text) {
        var el = $(selector);
        if (el && text != null) el.textContent = text;
    }

    function setAll(selector, texts) {
        document.querySelectorAll(selector).forEach(function (el, i) {
            if (texts[i] != null) el.textContent = texts[i];
        });
    }

    function updateContent() {
        var t = window.translations[window.currentLanguage];
        if (!t) return;

        document.title = t.pageTitle;
        var metaDesc = $('meta[name="description"]');
        if (metaDesc) metaDesc.content = t.metaDescription;

        // Navigation
        setText('.nav-logo', t.nav.logo);
        ['about', 'skills', 'projects', 'experience', 'contact'].forEach(function (id) {
            setText('.nav-link[href="#' + id + '"]', t.nav[id]);
        });

        // Hero
        setText('.hero-name', t.hero.name);
        setText('.hero-subtitle', t.hero.subtitle);
        setText('.hero-description', t.hero.description);
        setText('.hero-buttons a[href="#projects"]', t.hero.buttonProjects);
        setText('.hero-buttons a[href="#contact"]', t.hero.buttonContact);

        // About
        setText('#about .section-title', t.about.title);
        setAll('.about-text p', [t.about.paragraph1, t.about.paragraph2]);
        setAll('.stat-label', [t.about.stat1Label, t.about.stat2Label, t.about.stat3Label]);

        // Section titles (their content is rendered by the dedicated scripts)
        setText('#skills .section-title', t.skills.title);
        setText('.certifications-section .subsection-title', t.skills.certificationsTitle);
        setText('#projects .section-title', t.projects.title);
        setText('#experience .section-title', t.experience.title);

        // MNIST demo
        setText('#mnist-demo .section-title', t.mnistDemo.title);
        setText('.mnist-description', t.mnistDemo.description);
        setText('.drawing-section h3', t.mnistDemo.drawingTitle);
        setText('#clearCanvas', t.mnistDemo.clearButton);
        setText('#predictDigit', t.mnistDemo.predictButton);
        setText('.preview-section h3', t.mnistDemo.previewTitle);
        setAll('.preview-info p', [t.mnistDemo.previewLine1, t.mnistDemo.previewLine2, t.mnistDemo.previewLine3]);
        setText('.prediction-section h3', t.mnistDemo.predictionTitle);
        setText('#predictionTable .prediction-placeholder', t.mnistDemo.predictionPlaceholder);

        // Contact
        setText('#contact .section-title', t.contact.title);
        setText('.contact-description', t.contact.description);
        setAll('.contact-method span:last-child', [t.contact.method1, t.contact.method2, t.contact.method3]);
        setText('label[for="name"]', t.contact.form.nameLabel);
        setText('label[for="email"]', t.contact.form.emailLabel);
        setText('label[for="message"]', t.contact.form.messageLabel);
        setText('.btn-text', t.contact.form.submitButton);
        setText('.btn-loading', t.contact.form.submitButtonLoading);

        // Footer
        setText('.footer-copyright', t.footer.copyright.replace(/20\d\d/, new Date().getFullYear()));
        setText('.footer-role', t.footer.role);
        var built = $('.footer-built');
        if (built) {
            built.firstChild.textContent = t.footer.built + ' ';
            built.querySelector('a').textContent = t.footer.source;
        }
    }

    function setLanguage(lang) {
        window.currentLanguage = lang;
        try { localStorage.setItem('language', lang); } catch (e) {}
        document.documentElement.lang = lang;
        // The toggle shows the language you can switch to
        setText('.language-icon', lang === 'en' ? 'FR' : 'EN');
        document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
        updateContent();
    }

    function loadTranslations() {
        fetch('./texte.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                window.translations = data;
                var saved = null;
                try { saved = localStorage.getItem('language'); } catch (e) {}
                setLanguage(saved || ((navigator.language || '').startsWith('fr') ? 'fr' : 'en'));
            })
            .catch(function (error) {
                // The English HTML stays in place
                console.error('Error loading translations:', error);
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var toggle = document.getElementById('language-toggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                setLanguage(window.currentLanguage === 'en' ? 'fr' : 'en');
            });
        }
        loadTranslations();
    });
})();
