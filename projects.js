// Projects section: the featured projects, then the others by year, next to a sticky projects/skills graph
// (graph.json). Hovering a project lights its skills; hovering or clicking a skill highlights its projects.
// Texts come from texte.json.
// start = first commit or start date (see Neo4j); exp = experience it belongs to (used by experience-graph.js).
// A link href of 'report' points to the translated internship report; org links are shown as context.
(function () {
    'use strict';

    var PROJECTS = [
        { key: 'card15', featured: true, cat: 'llm', start: '2026-09', exp: 'Astek', links: [{ href: 'https://astekgroup.fr/', org: true }] },
        { key: 'card10', featured: true, cat: 'research', start: '2026-01', exp: 'UQAC', links: [{ href: 'https://www.uqac.ca/tag/liara/', org: true }, { href: 'https://github.com/Leon-afk1/Sample-Efficient_Contrastive_Learning' }] },
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

    var graph = null;         // graph.json
    var skillsByCard = {};    // card key -> [skill names]
    var nodeByCard = {};      // card key -> graph node id
    var graphEls = null;      // { svg, nodes: {id: g}, edges: [line] }
    var rows = {};            // card key -> li

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

    function tagList(p, t) {
        var tags = el('ul', 'project-tags');
        tags.setAttribute('aria-label', t.projects.tagsLabel);
        tagsOf(p).forEach(function (tag) { tags.appendChild(el('li', 'tag', tag)); });
        return tags;
    }

    function linkList(cfg, p) {
        var links = el('div', 'project-links');
        cfg.links.forEach(function (l, i) {
            if (l.org) return;
            var a = el('a', 'project-link', p['link' + (i + 1) + 'Text']);
            a.href = l.href === 'report' ? p.reportUrl : l.href;
            if (!l.internal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            links.appendChild(a);
        });
        return links;
    }

    // ---------- Featured projects

    function renderFeature(cfg, t) {
        var p = t.projects[cfg.key];
        var li = el('li', 'project-feature');
        li.dataset.key = cfg.key;

        var head = el('div', 'project-feature-head');
        var title = el('h3', 'project-feature-title', p.title);
        title.id = 'project-' + cfg.key;
        title.tabIndex = -1;
        head.appendChild(title);
        var org = orgOf(cfg, p);
        head.appendChild(el('p', 'project-org', org ? org + ', ' + cfg.start.slice(0, 4) : cfg.start.slice(0, 4)));
        head.appendChild(linkList(cfg, p));
        li.appendChild(head);

        var body = el('div', 'project-feature-body');
        body.appendChild(el('p', 'project-description', p.description));
        body.appendChild(tagList(p, t));
        li.appendChild(body);
        li.addEventListener('mouseenter', function () { focusProject(cfg.key); });
        li.addEventListener('mouseleave', leaveProject);
        rows[cfg.key] = li;
        return li;
    }

    // ---------- Index of the other projects

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
        var inner = el('div', 'project-detail-inner');
        inner.appendChild(el('p', 'project-description', p.description));
        inner.appendChild(tagList(p, t));
        inner.appendChild(linkList(cfg, p));
        detail.appendChild(inner);
        li.appendChild(detail);

        head.addEventListener('click', function () { setOpen(cfg.key, !openKeys[cfg.key]); });
        head.addEventListener('mouseenter', function () { focusProject(cfg.key); });
        head.addEventListener('focus', function () { focusProject(cfg.key); });
        head.addEventListener('mouseleave', leaveProject);
        rows[cfg.key] = li;
        return li;
    }

    function setOpen(key, open) {
        openKeys[key] = open;
        var li = rows[key];
        var row = li && $('.project-row', li);
        if (!row) return;
        li.classList.toggle('is-open', open);
        row.setAttribute('aria-expanded', String(open));
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

        var layout = el('div', 'projects-layout');
        var main = el('div', 'projects-main');
        var featured = el('ol', 'projects-featured');
        PROJECTS.filter(function (cfg) { return cfg.featured; }).forEach(function (cfg) { featured.appendChild(renderFeature(cfg, t)); });
        main.appendChild(featured);

        var indexHead = el('div', 'projects-index-head');
        indexHead.appendChild(el('h3', 'projects-index-title', t.projects.otherTitle));
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
        indexHead.appendChild(bar);
        main.appendChild(indexHead);

        var list = el('div', 'projects-chapters');
        var byYear = {};
        PROJECTS.filter(function (cfg) { return !cfg.featured; }).forEach(function (cfg) {
            (byYear[cfg.start.slice(0, 4)] = byYear[cfg.start.slice(0, 4)] || []).push(cfg);
        });
        Object.keys(byYear).sort().reverse().forEach(function (year) {
            var ch = el('div', 'year-chapter');
            ch.setAttribute('role', 'group');
            ch.setAttribute('aria-labelledby', 'year-' + year);
            var num = el('h4', 'year-num', year);
            num.id = 'year-' + year;
            ch.appendChild(num);
            var ol = el('ol', 'project-rows');
            byYear[year].forEach(function (cfg) { ol.appendChild(renderRow(cfg, t)); });
            ch.appendChild(ol);
            list.appendChild(ch);
        });
        main.appendChild(list);
        layout.appendChild(main);
        layout.appendChild(el('aside', 'projects-graph'));
        root.appendChild(layout);

        PROJECTS.forEach(function (cfg) { setOpen(cfg.key, !!openKeys[cfg.key]); });
        applyFilter();
        renderSkillsGraph(t);
    }

    // ---------- Projects/skills graph

    function renderSkillsGraph(t) {
        var host = $('.projects-graph');
        if (!host) return;
        host.innerHTML = '';
        host.setAttribute('aria-label', t.projects.graphLabel);
        // aria-label rather than <title>: a <title> shows as a tooltip that hides part of the graph
        var svg = svgEl('svg', { 'class': 'projects-graph-svg', role: 'img', 'aria-label': t.projects.graphLabel });
        var inner = el('div', 'projects-graph-inner');
        host.appendChild(inner);
        inner.appendChild(svg);
        var cap = el('p', 'projects-graph-caption');
        cap.setAttribute('aria-live', 'polite');
        inner.appendChild(cap);
        if (graph) renderGraph(svg, t);
        resetCaption();
        if (activeSkill) focusSkill(activeSkill);
    }

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
            g.appendChild(svgEl('circle', { r: isSkill ? 13 : 9 }));
            var left = n.x > cx + 150;
            var label = svgEl('text', { x: left ? -20 : 20, y: 8, 'text-anchor': left ? 'end' : 'start' });
            label.textContent = n.card && t.projects[n.card] ? t.projects[n.card].title : n.label;
            g.appendChild(label);
            if (isSkill) {
                g.setAttribute('tabindex', '0');
                g.setAttribute('role', 'button');
                g.setAttribute('aria-label', n.label);
                g.addEventListener('click', function (e) { e.stopPropagation(); toggleSkill(n.label); });
                g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSkill(n.label); } });
                g.addEventListener('mouseenter', function () { g.classList.add('is-hover'); if (!activeSkill) showSkill(n.label); });
                g.addEventListener('mouseleave', function () { g.classList.remove('is-hover'); if (!activeSkill) clearSkill(); });
            } else if (n.card) {
                g.addEventListener('click', function (e) { e.stopPropagation(); window.portfolioProjects.open(n.card); });
                g.addEventListener('mouseenter', function () { g.classList.add('is-hover'); focusProject(n.card); });
                g.addEventListener('mouseleave', function () { g.classList.remove('is-hover'); leaveProject(); });
            }
            svg.appendChild(g);
            nodes[id] = g;
        });
        graphEls = { svg: svg, nodes: nodes, edges: edges };
        hideCollidingLabels(svg);
    }

    // Skills linked to the most projects keep their label; a label that would overlap one of them waits for hover
    function hideCollidingLabels(svg) {
        var degree = {};
        graph.edges.forEach(function (e) { degree[e[1]] = (degree[e[1]] || 0) + 1; });
        var placed = [];
        Array.prototype.slice.call(svg.querySelectorAll('.pg-skill'))
            .sort(function (a, b) { return (degree['s:' + b.getAttribute('aria-label')] || 0) - (degree['s:' + a.getAttribute('aria-label')] || 0); })
            .forEach(function (g) {
                var label = g.querySelector('text'), r = label.getBoundingClientRect();
                var clash = placed.some(function (p) { return r.left < p.right + 4 && r.right > p.left - 4 && r.top < p.bottom && r.bottom > p.top; });
                g.classList.toggle('label-on-demand', clash);
                if (!clash) placed.push(r);
            });
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
        var t = texts();
        if (activeSkill || !t) return;
        var id = nodeByCard[key];
        if (!id) { light(null); return; }
        var set = {}; set[id] = 1;
        (skillsByCard[key] || []).forEach(function (s) { set['s:' + s] = 1; });
        light(set);
        caption(t.projects[key].title + ': ' + (skillsByCard[key] || []).join(', '));
    }

    function leaveProject() { if (!activeSkill) { light(null); resetCaption(); } }

    // Lights a skill and its projects, in the graph and in the list
    function showSkill(skill) {
        var t = texts();
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

    function focusSkill(skill) {
        activeSkill = skill;
        showSkill(skill);
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
        focusSkill: function (skill) {
            focusSkill(skill);
            $('#projects-list').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
        },
        open: function (key) {
            if (activeFilter !== 'all') { activeFilter = 'all'; applyFilter(); }
            setOpen(key, true);
            var li = rows[key];
            if (!li) return;
            li.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
            ($('.project-row', li) || $('.project-feature-title', li)).focus({ preventScroll: true });
        }
    };

    document.addEventListener('click', function (e) {
        if (activeSkill && !e.target.closest('.pg-skill') && !e.target.closest('.hg-skill') && !e.target.closest('.project-row')) clearSkill();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && activeSkill) clearSkill(); });
    document.addEventListener('languageChanged', function () { setTimeout(render, 0); });
    document.addEventListener('DOMContentLoaded', function () {
        render();
        fetch('graph.json?v=20261108b').then(function (r) { return r.json(); }).then(function (data) {
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
