// Projects section: one chapter per year (large year that lights up when on screen) next to a sticky
// projects/skills graph (graph.json). Hovering a project lights its skills; clicking a skill in the graph
// highlights every project that uses it. Texts come from texte.json.
// start = first commit or start date (see Neo4j); exp = experience it belongs to (used by experience-graph.js).
// A link href of 'report' points to the translated internship report; org links are shown as context.
(function () {
    'use strict';

    var PROJECTS = [
        { key: 'card10', featured: true, cat: 'research', start: '2026-03', exp: 'UQAC', links: [{ href: 'https://www.uqac.ca/tag/liara/', org: true }, { href: 'https://github.com/Leon-afk1/Sample-Efficient_Contrastive_Learning' }] },
        { key: 'card13', cat: 'ml', start: '2026-05', exp: 'UQAC', links: [{ href: 'https://www.uqac.ca/', org: true }, { href: 'https://github.com/Leon-afk1/multimodal-parkinson-detection' }] },
        { key: 'card12', cat: 'vision', start: '2026-05', exp: 'UQAC', links: [{ href: 'https://github.com/Leon-afk1/agroscan' }] },
        { key: 'card11', cat: 'llm', start: '2026-01', exp: 'UQAC', links: [{ href: 'https://www.uqac.ca/', org: true }, { href: 'https://github.com/Leon-afk1/ChatBot_UQAC' }] },
        { key: 'card1', featured: true, cat: 'llm', start: '2025-11', exp: 'Hackathon', links: [{ href: 'https://github.com/Leon-afk1/Hackathon_CTI_UQAC.git' }, { href: 'https://www.uqac.ca/', org: true }] },
        { key: 'card14', cat: 'llm', start: '2025-11', exp: null, links: [{ href: 'https://github.com/Leon-afk1/Leon-afk1.github.io/tree/main/backend' }, { href: 'https://github.com/Leon-afk1/Leon-afk1.github.io/tree/main/infra' }] },
        { key: 'card6', cat: 'vision', start: '2025-03', exp: 'UTBM', links: [{ href: 'https://github.com/Leon-afk1/CNN-to-transfertlearning' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card3', featured: true, cat: 'llm', start: '2024-12', exp: 'Ksilink', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'report' }] },
        { key: 'card2', cat: 'research', start: '2024-09', exp: 'Ksilink', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'https://arxiv.org/pdf/2408.05196' }, { href: 'report' }] },
        { key: 'card4', cat: 'vision', start: '2024-09', exp: 'Ksilink', links: [{ href: 'https://ksilink.com/', org: true }, { href: 'report' }] },
        { key: 'card7', cat: 'vision', start: '2024-09', exp: 'Ksilink', links: [{ href: '#mnist-demo', internal: true }, { href: 'https://ksilink.com/', org: true }] },
        { key: 'card8', cat: 'ml', start: '2024-03', exp: 'UTBM', links: [{ href: 'https://github.com/Leon-afk1/Music_type_classification' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card5', cat: 'ml', start: '2023-10', exp: 'UTBM', links: [{ href: 'https://github.com/Leon-afk1/poisonous_mushroom' }, { href: 'https://www.utbm.fr/', org: true }] },
        { key: 'card9', cat: 'ml', start: '2022-04', exp: 'UTBM', links: [{ href: 'https://github.com/Leon-afk1/Tangram_solver' }, { href: 'https://www.utbm.fr/', org: true }] }
    ];
    var FILTERS = ['all', 'llm', 'vision', 'research', 'ml'];
    var SVG_NS = 'http://www.w3.org/2000/svg';

    var activeFilter = 'all';
    var activeSkill = null;
    var openKeys = {};
    PROJECTS.forEach(function (p) { if (p.featured) openKeys[p.key] = true; });

    var graph = null;         // graph.json
    var skillsByCard = {};    // card key -> [skill names]
    var nodeByCard = {};      // card key -> graph node id
    var graphEls = null;      // { svg, nodes: {id: g}, edges: [line] }
    var rows = {};            // card key -> li
    var chapterObserver = null;

    function $(s, r) { return (r || document).querySelector(s); }
    function el(tag, className, text) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    }
    function svgEl(name, attrs) {
        var e = document.createElementNS(SVG_NS, name);
        Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }
    function texts() { return window.translations && window.translations[window.currentLanguage === 'fr' ? 'fr' : 'en']; }
    function tagsOf(p) {
        return Object.keys(p).filter(function (k) { return /^tag\d+$/.test(k); })
            .sort(function (a, b) { return +a.slice(3) - +b.slice(3); })
            .map(function (k) { return p[k]; });
    }
    function orgOf(cfg, p) {
        var i = cfg.links.map(function (l) { return !!l.org; }).indexOf(true);
        return i === -1 ? '' : p['link' + (i + 1) + 'Text'];
    }
    function reduceMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

    // ---------- List

    function renderRow(cfg, t) {
        var p = t.projects[cfg.key];
        var li = el('li', 'project-card');
        li.dataset.cat = cfg.cat;
        li.dataset.key = cfg.key;

        var head = el('button', 'project-row');
        head.type = 'button';
        head.id = 'project-' + cfg.key;
        head.setAttribute('aria-controls', 'project-' + cfg.key + '-detail');
        head.appendChild(el('span', 'project-title', p.title));
        head.appendChild(el('span', 'project-org', orgOf(cfg, p)));
        li.appendChild(head);

        var detail = el('div', 'project-detail');
        detail.id = 'project-' + cfg.key + '-detail';
        detail.appendChild(el('p', 'project-description', p.description));
        var tags = el('ul', 'project-tags');
        tags.setAttribute('aria-label', t.projects.tagsLabel);
        tagsOf(p).forEach(function (tag) { tags.appendChild(el('li', 'tag', tag)); });
        detail.appendChild(tags);
        var links = el('div', 'project-links');
        cfg.links.forEach(function (l, i) {
            if (l.org) return;
            var a = el('a', 'project-link', p['link' + (i + 1) + 'Text']);
            a.href = l.href === 'report' ? p.reportUrl : l.href;
            if (!l.internal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            links.appendChild(a);
        });
        detail.appendChild(links);
        li.appendChild(detail);

        head.addEventListener('click', function () { setOpen(cfg.key, !openKeys[cfg.key]); });
        head.addEventListener('mouseenter', function () { focusProject(cfg.key); });
        head.addEventListener('focus', function () { focusProject(cfg.key); });
        head.addEventListener('mouseleave', function () { if (!activeSkill) { light(null); resetCaption(); } });
        rows[cfg.key] = li;
        return li;
    }

    function setOpen(key, open) {
        openKeys[key] = open;
        var li = rows[key];
        if (!li) return;
        li.classList.toggle('is-open', open);
        $('.project-row', li).setAttribute('aria-expanded', String(open));
    }

    function applyFilter() {
        var root = $('#projects-list');
        root.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.filter === activeFilter)); });
        root.querySelectorAll('.year-chapter').forEach(function (ch) {
            var visible = 0;
            ch.querySelectorAll('.project-card').forEach(function (c) {
                c.hidden = activeFilter !== 'all' && c.dataset.cat !== activeFilter;
                if (!c.hidden) visible++;
            });
            ch.hidden = visible === 0;
        });
    }

    function render() {
        var t = texts();
        var root = $('#projects-list');
        if (!t || !root) return;
        root.innerHTML = '';
        rows = {};

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

        var layout = el('div', 'projects-layout');
        var list = el('div', 'projects-chapters');
        var byYear = {};
        PROJECTS.forEach(function (cfg) { (byYear[cfg.start.slice(0, 4)] = byYear[cfg.start.slice(0, 4)] || []).push(cfg); });
        if (chapterObserver) chapterObserver.disconnect();
        chapterObserver = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
            entries.forEach(function (e) { e.target.classList.toggle('is-current', e.isIntersecting); });
        }, { rootMargin: '-35% 0px -45% 0px' }) : null;

        Object.keys(byYear).sort().reverse().forEach(function (year) {
            var ch = el('div', 'year-chapter');
            ch.setAttribute('role', 'group');
            ch.setAttribute('aria-labelledby', 'year-' + year);
            var head = el('div', 'year-head');
            var num = el('h3', 'year-num', year);
            num.id = 'year-' + year;
            head.appendChild(num);
            head.appendChild(el('p', 'year-context', (t.projects.yearContext || {})[year] || ''));
            ch.appendChild(head);
            var ol = el('ol', 'project-rows');
            byYear[year].forEach(function (cfg) { ol.appendChild(renderRow(cfg, t)); });
            ch.appendChild(ol);
            list.appendChild(ch);
            if (chapterObserver) chapterObserver.observe(ch); else ch.classList.add('is-current');
        });
        layout.appendChild(list);

        var aside = el('aside', 'projects-graph');
        aside.setAttribute('aria-label', t.projects.graphLabel);
        // aria-label rather than <title>: a <title> shows as a tooltip that hides part of the graph
        var svg = svgEl('svg', { 'class': 'projects-graph-svg', role: 'img', 'aria-label': t.projects.graphLabel });
        aside.appendChild(svg);
        var caption = el('p', 'projects-graph-caption');
        caption.setAttribute('aria-live', 'polite');
        aside.appendChild(caption);
        layout.appendChild(aside);
        root.appendChild(layout);

        PROJECTS.forEach(function (cfg) { setOpen(cfg.key, !!openKeys[cfg.key]); });
        applyFilter();
        if (graph) renderGraph(svg, t);
        resetCaption();
        if (activeSkill) focusSkill(activeSkill);
    }

    // ---------- Graph

    function renderGraph(svg, t) {
        var keep = {};
        graph.nodes.forEach(function (n) { if (n.type === 'project' || n.type === 'skill') keep[n.id] = n; });
        svg.setAttribute('viewBox', '0 0 ' + graph.width + ' ' + graph.height);
        var nodes = {}, edges = [];
        var gEdges = svgEl('g');
        graph.edges.forEach(function (e) {
            var a = keep[e[0]], b = keep[e[1]];
            if (!a || !b) return;
            var line = svgEl('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'class': 'pg-edge' });
            line.dataset.a = a.id; line.dataset.b = b.id;
            gEdges.appendChild(line); edges.push(line);
        });
        svg.appendChild(gEdges);
        var cx = graph.width / 2;
        Object.keys(keep).forEach(function (id) {
            var n = keep[id], isSkill = n.type === 'skill';
            var g = svgEl('g', { 'class': 'pg-node ' + (isSkill ? 'pg-skill' : 'pg-project'), transform: 'translate(' + n.x + ' ' + n.y + ')' });
            g.appendChild(svgEl('circle', { r: isSkill ? 10 : 13 }));
            var left = n.x > cx + 150;
            var label = svgEl('text', { x: left ? -18 : 18, y: 7, 'text-anchor': left ? 'end' : 'start' });
            label.textContent = n.card && t.projects[n.card] ? t.projects[n.card].title : n.label;
            g.appendChild(label);
            if (isSkill) {
                g.setAttribute('tabindex', '0');
                g.setAttribute('role', 'button');
                g.setAttribute('aria-label', n.label);
                g.addEventListener('click', function (e) { e.stopPropagation(); toggleSkill(n.label); });
                g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSkill(n.label); } });
                g.addEventListener('mouseenter', function () { g.classList.add('is-hover'); });
                g.addEventListener('mouseleave', function () { g.classList.remove('is-hover'); });
            }
            svg.appendChild(g);
            nodes[id] = g;
        });
        graphEls = { svg: svg, nodes: nodes, edges: edges };
    }

    function light(set) {
        if (!graphEls) return;
        graphEls.svg.classList.toggle('has-focus', !!set);
        Object.keys(graphEls.nodes).forEach(function (id) { graphEls.nodes[id].classList.toggle('is-lit', !!set && !!set[id]); });
        graphEls.edges.forEach(function (l) { l.classList.toggle('is-lit', !!set && !!set[l.dataset.a] && !!set[l.dataset.b]); });
    }

    function caption(text) { var c = $('.projects-graph-caption'); if (c) c.textContent = text; }
    function resetCaption() { var t = texts(); if (t) caption(t.projects.graphHint); }

    function focusProject(key) {
        if (activeSkill) return;
        var id = nodeByCard[key];
        if (!id) { light(null); return; }
        var set = {}; set[id] = 1;
        (skillsByCard[key] || []).forEach(function (s) { set['s:' + s] = 1; });
        light(set);
        caption((skillsByCard[key] || []).join(', '));
    }

    function focusSkill(skill) {
        var t = texts();
        activeSkill = skill;
        var set = {}, count = 0;
        set['s:' + skill] = 1;
        PROJECTS.forEach(function (cfg) {
            var match = (skillsByCard[cfg.key] || []).indexOf(skill) !== -1;
            if (match) { set[nodeByCard[cfg.key]] = 1; count++; }
            var li = rows[cfg.key];
            if (li) { li.classList.toggle('is-match', match); li.classList.toggle('is-dim', !match); }
        });
        light(set);
        caption(t.projects.skillMatch.replace('{skill}', skill).replace('{n}', count));
    }

    function toggleSkill(skill) {
        if (activeSkill === skill) clearSkill(); else focusSkill(skill);
    }

    function clearSkill() {
        activeSkill = null;
        Object.keys(rows).forEach(function (k) { rows[k].classList.remove('is-match', 'is-dim'); });
        light(null);
        resetCaption();
    }

    // Lights the projects and skills named in an assistant answer (floating chatbot)
    function highlightText(answer) {
        var t = texts();
        if (!t || !graph || activeSkill) return;
        var text = answer.toLowerCase(), set = {}, names = [];
        graph.nodes.forEach(function (n) {
            if (n.type !== 'project' && n.type !== 'skill') return;
            var labels = [n.label];
            if (n.card && t.projects[n.card]) labels.push(t.projects[n.card].title);
            var hit = labels.some(function (l) { return l.length > 2 && text.indexOf(l.toLowerCase()) !== -1; });
            if (hit) { set[n.id] = 1; names.push(labels[labels.length - 1]); }
        });
        if (!names.length) return;
        light(set);
        caption(t.projects.citedByAssistant.replace('{names}', names.join(', ')));
    }

    // Used by the hero graph, the experience constellation and the floating chatbot
    window.portfolioProjects = {
        list: PROJECTS,
        highlightText: highlightText,
        open: function (key) {
            if (activeFilter !== 'all') { activeFilter = 'all'; applyFilter(); }
            setOpen(key, true);
            var li = rows[key];
            if (li) {
                li.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
                $('.project-row', li).focus({ preventScroll: true });
            }
        }
    };

    document.addEventListener('click', function (e) {
        if (activeSkill && !e.target.closest('.pg-skill') && !e.target.closest('.project-row')) clearSkill();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && activeSkill) clearSkill(); });
    document.addEventListener('languageChanged', function () { setTimeout(render, 0); });
    document.addEventListener('DOMContentLoaded', function () {
        render();
        fetch('graph.json?v=20261031e').then(function (r) { return r.json(); }).then(function (data) {
            graph = data;
            data.nodes.forEach(function (n) { if (n.card) nodeByCard[n.card] = n.id; });
            var cardById = {};
            data.nodes.forEach(function (n) { if (n.card) cardById[n.id] = n.card; });
            data.edges.forEach(function (e) {
                var card = cardById[e[0]];
                if (card && e[1].indexOf('s:') === 0) (skillsByCard[card] = skillsByCard[card] || []).push(e[1].slice(2));
            });
            render();
        }).catch(function () {});
    });
})();
