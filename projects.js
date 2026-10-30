// Projects section, rendered from texte.json (titles, tags, descriptions, link labels).
// Order, category, year (first commit or start date, see Neo4j) and link targets live here.
// A link href of 'report' points to the translated internship report (projects.<key>.reportUrl);
// org links are shown as context (where the project was done), not as links.
(function () {
    'use strict';

    var PROJECTS = [
        { key: 'card10', featured: true, cat: 'research', year: '2026', links: [{ href: 'https://www.uqac.ca/tag/liara/', org: true }, { href: 'https://github.com/Leon-afk1/Sample-Efficient_Contrastive_Learning' }] },
        { key: 'card3', featured: true, cat: 'llm', year: '2024', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'report' }] },
        { key: 'card1', featured: true, cat: 'llm', year: '2025', links: [{ href: 'https://github.com/Leon-afk1/Hackathon_CTI_UQAC.git' }, { href: 'https://www.uqac.ca/', org: true }] },
        { key: 'card14', cat: 'llm', year: '2025', links: [{ href: 'https://github.com/Leon-afk1/Leon-afk1.github.io/tree/main/backend' }, { href: 'https://github.com/Leon-afk1/Leon-afk1.github.io/tree/main/infra' }] },
        { key: 'card12', cat: 'vision', year: '2026', links: [{ href: 'https://github.com/Leon-afk1/agroscan' }] },
        { key: 'card13', cat: 'ml', year: '2026', links: [{ href: 'https://www.uqac.ca/', org: true }, { href: 'https://github.com/Leon-afk1/multimodal-parkinson-detection' }] },
        { key: 'card2', cat: 'research', year: '2024', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'https://arxiv.org/pdf/2408.05196' }, { href: 'report' }] },
        { key: 'card11', cat: 'llm', year: '2026', links: [{ href: 'https://www.uqac.ca/', org: true }, { href: 'https://github.com/Leon-afk1/ChatBot_UQAC' }] },
        { key: 'card4', cat: 'vision', year: '2024', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'report' }] },
        { key: 'card5', cat: 'ml', year: '2023', links: [{ href: 'https://github.com/Leon-afk1/poisonous_mushroom' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card6', cat: 'vision', year: '2025', links: [{ href: 'https://github.com/Leon-afk1/CNN-to-transfertlearning' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card7', cat: 'vision', year: '2025', links: [{ href: '#mnist-demo', internal: true }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card8', cat: 'ml', year: '2024', links: [{ href: 'https://github.com/Leon-afk1/Music_type_classification' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card9', cat: 'ml', year: '2022', links: [{ href: 'https://github.com/Leon-afk1/Tangram_solver' }, { href: 'https://www.utbm.fr/', org: true }] }
    ];
    var FILTERS = ['all', 'llm', 'vision', 'research', 'ml'];
    var activeFilter = 'all';

    function $(s, r) { return (r || document).querySelector(s); }

    function el(tag, className, text) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    }

    function tagsOf(p) {
        return Object.keys(p).filter(function (k) { return /^tag\d+$/.test(k); })
            .sort(function (a, b) { return +a.slice(3) - +b.slice(3); })
            .map(function (k) { return p[k]; });
    }

    function renderProject(cfg, t) {
        var p = t.projects[cfg.key];
        var card = el('article', 'project-card' + (cfg.featured ? ' project-card--featured' : ''));
        card.dataset.cat = cfg.cat;

        var main = el('div', 'project-main');
        var meta = el('p', 'project-meta');
        meta.appendChild(el('span', 'project-year', cfg.year));
        cfg.links.forEach(function (l, i) {
            if (l.org) meta.appendChild(el('span', 'project-org', p['link' + (i + 1) + 'Text']));
        });
        main.appendChild(meta);
        main.appendChild(el('h4', 'project-title', p.title));
        main.appendChild(el('p', 'project-description', p.description));
        card.appendChild(main);

        var side = el('div', 'project-side');
        var tags = el('ul', 'project-tags');
        tags.setAttribute('aria-label', t.projects.tagsLabel);
        tagsOf(p).forEach(function (tag) { tags.appendChild(el('li', 'tag', tag)); });
        side.appendChild(tags);

        var links = el('div', 'project-links');
        cfg.links.forEach(function (l, i) {
            if (l.org) return;
            var a = el('a', 'project-link', p['link' + (i + 1) + 'Text']);
            a.href = l.href === 'report' ? p.reportUrl : l.href;
            if (!l.internal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            links.appendChild(a);
        });
        side.appendChild(links);
        card.appendChild(side);
        return card;
    }

    function applyFilter() {
        var root = $('#projects-list');
        root.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === activeFilter)); });
        root.querySelectorAll('.project-group').forEach(function (group) {
            var visible = 0;
            group.querySelectorAll('.project-card').forEach(function (c) {
                c.hidden = activeFilter !== 'all' && c.dataset.cat !== activeFilter;
                if (!c.hidden) visible++;
            });
            group.hidden = visible === 0;
        });
    }

    function render() {
        var t = window.translations && window.translations[window.currentLanguage === 'fr' ? 'fr' : 'en'];
        var root = $('#projects-list');
        if (!t || !root) return;
        root.innerHTML = '';

        var bar = el('div', 'project-filters');
        bar.setAttribute('role', 'group');
        bar.setAttribute('aria-label', t.projects.filtersLabel);
        FILTERS.forEach(function (k) {
            var b = el('button', 'filter-btn', t.projects.filters[k]);
            b.type = 'button';
            b.dataset.filter = k;
            b.addEventListener('click', function () { activeFilter = k; applyFilter(); });
            bar.appendChild(b);
        });
        root.appendChild(bar);

        [[true, t.projects.selectedWork], [false, t.projects.moreProjects]].forEach(function (g) {
            var group = el('div', 'project-group' + (g[0] ? ' project-group--featured' : ''));
            group.appendChild(el('h3', 'project-group-title', g[1]));
            var list = el('div', 'project-list');
            PROJECTS.filter(function (p) { return !!p.featured === g[0]; })
                .forEach(function (p) { list.appendChild(renderProject(p, t)); });
            group.appendChild(list);
            root.appendChild(group);
        });
        applyFilter();
    }

    document.addEventListener('languageChanged', function () { setTimeout(render, 0); });
    document.addEventListener('DOMContentLoaded', render);
})();
