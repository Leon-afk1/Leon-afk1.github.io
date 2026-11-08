// Hero: Léon's knowledge graph (graph.json, exported from Neo4j by tools/export_graph.py)
// and a question box wired to the Graph RAG assistant. Nodes cited in the answer light up.
(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var RADIUS = { person: 11, project: 7.5, experience: 7.5, skill: 5 };
    var FALLBACK = {
        askLabel: 'Ask my knowledge graph', askPlaceholder: 'e.g. Which projects use Graph RAG?', askButton: 'Ask',
        askLoading: 'Querying the graph…', askRateLimited: 'Too many questions in a short time. Wait a minute, then ask again.',
        askError: 'The assistant did not answer. Try again in a moment, or use the chat button at the bottom right.',
        askSuggestions: ['Which projects use Graph RAG?', 'What did Léon do at Ksilink?'],
        graphTitle: "Léon's knowledge graph, exported from the Neo4j database the assistant queries",
        graphHint: 'Nodes mentioned in the answer light up.',
        legendProjects: 'Projects', legendSkills: 'Skills', legendExperience: 'Experience and education'
    };

    var graph = null;
    var nodeEls = {};
    var edgeEls = [];
    var lastAnswer = '';
    var renderedWidth = 0;
    // Same conversation as the floating chatbot when it is on the page
    function sessionId() { return window.portfolioChat ? window.portfolioChat.sessionId : 'hero'; }

    function $(s, r) { return (r || document).querySelector(s); }

    function lang() { return window.currentLanguage === 'fr' ? 'fr' : 'en'; }

    function texts() {
        var t = window.translations && window.translations[lang()];
        return Object.assign({}, FALLBACK, t && t.hero);
    }

    // Project nodes show the translated card title when the project has a card
    function nodeLabel(node) {
        var t = window.translations && window.translations[lang()];
        if (node.card && t && t.projects && t.projects[node.card]) return t.projects[node.card].title;
        return node.label;
    }

    function el(name, attrs) {
        var e = document.createElementNS(SVG_NS, name);
        Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }

    // The exported layout is stretched to the screen: only positions change, so nodes and labels keep their size.
    // On wide screens the graph leaves the top left to the name and runs under the glass capsule.
    function layout(w, h) {
        var wide = w >= 900;
        var area = wide ? { x0: 0.4, x1: 0.965, y0: 0.27, y1: 0.885 } : { x0: 0.07, x1: 0.93, y0: 0.08, y1: 0.92 };
        var xs = graph.nodes.map(function (n) { return n.x; }), ys = graph.nodes.map(function (n) { return n.y; });
        var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
        var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
        return function (n) {
            return {
                x: Math.round(w * (area.x0 + (n.x - minX) / (maxX - minX) * (area.x1 - area.x0))),
                y: Math.round(h * (area.y0 + (n.y - minY) / (maxY - minY) * (area.y1 - area.y0)))
            };
        };
    }

    function render(svg) {
        var w = svg.clientWidth || 800, h = svg.clientHeight || 600;
        var scale = w >= 900 ? 1 : 0.8;
        renderedWidth = w;
        svg.innerHTML = '';
        nodeEls = {};
        edgeEls = [];
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        var place = layout(w, h);
        var byId = {};
        graph.nodes.forEach(function (n) {
            var pos = place(n);
            byId[n.id] = { id: n.id, type: n.type, label: n.label, card: n.card, x: pos.x, y: pos.y };
        });
        var positioned = graph.nodes.map(function (n) { return byId[n.id]; });

        var edges = el('g', { 'class': 'hg-edges' });
        graph.edges.forEach(function (pair) {
            var a = byId[pair[0]], b = byId[pair[1]];
            var line = el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'class': 'hg-edge' });
            line.dataset.a = a.id; line.dataset.b = b.id;
            edges.appendChild(line);
            edgeEls.push(line);
        });
        svg.appendChild(edges);

        var leon = byId.leon;
        var nodes = el('g', { 'class': 'hg-nodes' });
        positioned.forEach(function (n) {
            var g = el('g', { 'class': 'hg-node hg-' + n.type, transform: 'translate(' + n.x + ' ' + n.y + ')' });
            var r = RADIUS[n.type] * scale;
            g.appendChild(el('circle', { r: r }));
            // Léon's name sits above his node. Experiences are always labelled and point away from him;
            // long project and skill labels, shown on demand, point towards the middle so they stay on screen.
            // On a phone every label points inwards: there is no room outside the graph.
            var left = n.type === 'experience' && w >= 900 ? n.x < leon.x || n.x > w * 0.88 : n.x >= w * (w >= 900 ? 0.68 : 0.55);
            var label = n.type === 'person'
                ? el('text', { 'class': 'hg-label', x: 0, y: -(r + 8), 'text-anchor': 'middle' })
                : el('text', { 'class': 'hg-label', x: left ? -(r + 6) : r + 6, y: 4.5, 'text-anchor': left ? 'end' : 'start' });
            g.appendChild(label);
            g.addEventListener('mouseenter', function () { focusNode(n.id, true); });
            g.addEventListener('mouseleave', function () { focusNode(n.id, false); });
            if (n.card) {
                g.classList.add('hg-link');
                g.addEventListener('click', function () { scrollToCard(n); });
            }
            nodes.appendChild(g);
            nodeEls[n.id] = { node: n, g: g, label: label };
        });
        svg.appendChild(nodes);
        updateLabels();
        if (lastAnswer) highlight(lastAnswer);
    }

    function updateLabels() {
        Object.keys(nodeEls).forEach(function (id) { nodeEls[id].label.textContent = nodeLabel(nodeEls[id].node); });
    }

    function focusNode(id, on) {
        nodeEls[id].g.classList.toggle('is-hover', on);
        edgeEls.forEach(function (line) {
            if (line.dataset.a === id || line.dataset.b === id) line.classList.toggle('is-hover', on);
        });
    }

    function scrollToCard(node) {
        if (window.portfolioProjects) window.portfolioProjects.open(node.card);
    }

    // Light up nodes whose name appears in the answer (Léon himself is always part of it)
    function highlight(answer) {
        var text = answer.toLowerCase();
        var lit = {};
        var counts = { project: 0, skill: 0, experience: 0 };
        lastAnswer = answer;
        Object.keys(nodeEls).forEach(function (id) {
            var n = nodeEls[id].node;
            var names = [n.label, nodeLabel(n)].map(function (s) { return s.toLowerCase(); });
            var hit = id === 'leon' || names.some(function (s) { return s.length > 2 && text.indexOf(s) !== -1; });
            lit[id] = hit;
            nodeEls[id].g.classList.toggle('is-lit', hit);
            if (hit && id !== 'leon') counts[n.type]++;
        });
        edgeEls.forEach(function (line) { line.classList.toggle('is-lit', lit[line.dataset.a] && lit[line.dataset.b]); });
        $('.hero-graph').classList.toggle('has-answer', Object.keys(lit).filter(function (k) { return lit[k]; }).length > 1);
        if (window.fieldShader) window.fieldShader.cite(counts);
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
    }

    // The assistant answers in light Markdown: paragraphs, "* " bullets and **bold**
    function formatAnswer(md) {
        var html = '', list = false;
        escapeHtml(md.trim()).split(/\n+/).forEach(function (line) {
            var bullet = /^\s*[*-]\s+(.*)$/.exec(line);
            var content = (bullet ? bullet[1] : line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            if (bullet && !list) { html += '<ul>'; list = true; }
            if (!bullet && list) { html += '</ul>'; list = false; }
            html += bullet ? '<li>' + content + '</li>' : '<p>' + content + '</p>';
        });
        return html + (list ? '</ul>' : '');
    }

    function ask(question) {
        var t = texts();
        var form = $('#hero-ask'), box = $('#hero-ask-answer'), button = $('.hero-ask-submit', form);
        var api = window.CHATBOT_CONFIG ? window.CHATBOT_CONFIG.getApiUrl() : '';
        box.hidden = false;
        box.classList.remove('is-error');
        box.innerHTML = '<p class="hero-ask-loading">' + escapeHtml(t.askLoading) + '</p>';
        button.disabled = true;
        form.setAttribute('aria-busy', 'true');
        if (window.fieldShader) window.fieldShader.busy(true);

        fetch(api + '/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: question, session_id: sessionId(), language: lang() })
        }).then(function (r) {
            if (r.status === 429) throw new Error('rate');
            if (!r.ok) throw new Error('http');
            return r.json();
        }).then(function (data) {
            box.innerHTML = formatAnswer(data.response || '');
            highlight(data.response || '');
            if (window.portfolioChat) window.portfolioChat.addExchange(question, data.response || '');
        }).catch(function (e) {
            box.classList.add('is-error');
            box.innerHTML = '<p>' + escapeHtml(e.message === 'rate' ? t.askRateLimited : t.askError) + '</p>';
        }).then(function () {
            button.disabled = false;
            form.removeAttribute('aria-busy');
            if (window.fieldShader) window.fieldShader.busy(false);
        });
    }

    function applyTexts() {
        var t = texts();
        $('.hero-ask-label').textContent = t.askLabel;
        $('#hero-ask-input').placeholder = t.askPlaceholder;
        $('.hero-ask-submit').textContent = t.askButton;
        $('#hero-graph-svg').setAttribute('aria-label', t.graphTitle);
        $('.legend-project').textContent = t.legendProjects;
        $('.legend-skill').textContent = t.legendSkills;
        $('.legend-experience').textContent = t.legendExperience;
        $('.hero-graph-hint').textContent = t.graphHint;

        var sug = $('.hero-ask-suggestions');
        sug.innerHTML = '';
        t.askSuggestions.forEach(function (q) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'hero-ask-suggestion';
            b.textContent = q;
            b.addEventListener('click', function () { $('#hero-ask-input').value = q; ask(q); });
            sug.appendChild(b);
        });
        if (graph) updateLabels();
    }

    // Used by the floating chatbot to light up the nodes cited in its answers
    window.heroGraph = { highlight: function (answer) { if (graph) highlight(answer); } };

    document.addEventListener('DOMContentLoaded', function () {
        var svg = $('#hero-graph-svg'), form = $('#hero-ask');
        if (!svg || !form) return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var q = $('#hero-ask-input').value.trim();
            if (q) ask(q);
        });
        applyTexts();
        document.addEventListener('languageChanged', function () { setTimeout(applyTexts, 0); });

        fetch('graph.json?v=20261108b').then(function (r) { return r.json(); }).then(function (data) {
            graph = data;
            render(svg);
            var timer = 0;
            new ResizeObserver(function () {
                clearTimeout(timer);
                timer = setTimeout(function () { if (svg.clientWidth !== renderedWidth) render(svg); }, 120);
            }).observe(svg);
        }).catch(function () { $('.hero-graph').hidden = true; });
    });
})();
