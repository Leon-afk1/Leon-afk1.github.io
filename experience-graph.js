// Experience overview: projects (amber) and experiences (lilac bands) on one timeline.
// Each project sits at its start date, linked to the school or internship it belongs to.
// Clicking a band opens the matching timeline entry below; clicking a project opens it in the Projects section.
(function () {
    'use strict';

    // id -> dates and index of the matching .timeline-item; row = vertical lane of the band
    var EXPERIENCES = [
        { id: 'UTBM', from: '2021-09', to: '2027-02', item: 3, row: 0 },
        { id: 'Yeditepe', from: '2023-01', to: '2023-06', item: 5, row: 1 },
        { id: 'Ksilink', from: '2024-09', to: '2025-02', item: 4, row: 1 },
        { id: 'UQAC', from: '2025-09', to: '2027-02', item: 1, row: 2 },
        { id: 'Hackathon', from: '2025-11', to: '2025-12', item: 2, row: 3 },
        { id: 'Astek', from: '2026-09', to: '2027-02', item: 0, row: 3 }
    ];
    var FIRST = '2021-09', LAST = '2027-03';
    var W = 1200, PAD = 24, BAND_H = 26, BAND_GAP = 8, LANE = 46;
    var SVG_NS = 'http://www.w3.org/2000/svg';

    function svgEl(name, attrs) {
        var e = document.createElementNS(SVG_NS, name);
        Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
    }
    function month(ym) { var p = ym.split('-'); return +p[0] * 12 + (+p[1] - 1); }
    function X(ym) { return PAD + (month(ym) - month(FIRST)) / (month(LAST) - month(FIRST)) * (W - 2 * PAD); }
    function texts() { return window.translations && window.translations[window.currentLanguage === 'fr' ? 'fr' : 'en']; }
    function reduceMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

    function openExperience(index) {
        var item = document.querySelectorAll('.timeline-item')[index];
        if (!item) return;
        var header = item.querySelector('.tl-header');
        if (!item.classList.contains('is-open') && header) header.click();
        item.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
        if (header) header.focus({ preventScroll: true });
    }

    function activate(g, fn) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.addEventListener('click', fn);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
    }

    function render() {
        var t = texts();
        var svg = document.getElementById('experience-map-svg');
        if (!t || !svg || !window.portfolioProjects) return;
        svg.innerHTML = '';
        var title = svgEl('title'); title.textContent = t.experience.mapLabel; svg.appendChild(title);

        // Projects first, to know how many lanes they need above the bands
        var projects = window.portfolioProjects.list.slice().sort(function (a, b) { return a.start.localeCompare(b.start); });
        var lanes = [], placed = projects.map(function (p) {
            var x = X(p.start), lane = 0;
            while (lanes[lane] != null && x - lanes[lane] < 205) lane++;
            lanes[lane] = x;
            return { p: p, x: x, lane: lane };
        });
        var top = 20, base = top + (lanes.length - 1) * LANE + 10;
        var bandTop = base + 50;
        var H = bandTop + 4 * (BAND_H + BAND_GAP) + 36;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

        for (var y = 2022; y <= 2027; y++) {
            svg.appendChild(svgEl('line', { 'class': 'em-year-line', x1: X(y + '-01'), x2: X(y + '-01'), y1: top - 10, y2: H - 28 }));
            var yt = svgEl('text', { 'class': 'em-year', x: X(y + '-01') + 6, y: H - 10 });
            yt.textContent = y;
            svg.appendChild(yt);
        }

        var bandY = {};
        EXPERIENCES.forEach(function (e) { bandY[e.id] = bandTop + e.row * (BAND_H + BAND_GAP); });

        // Links under nodes and bands
        placed.forEach(function (n) {
            if (!n.p.exp) return;
            var y = base - n.lane * LANE;
            svg.appendChild(svgEl('line', { 'class': 'em-link', x1: n.x, y1: y, x2: n.x, y2: bandY[n.p.exp] }));
        });

        EXPERIENCES.forEach(function (e) {
            var g = svgEl('g', { 'class': 'em-band' });
            var x = X(e.from), w = Math.max(X(e.to) - x, 92);
            g.appendChild(svgEl('rect', { x: x, y: bandY[e.id], width: w, height: BAND_H, rx: 6 }));
            var label = svgEl('text', { x: x + 9, y: bandY[e.id] + 17 });
            label.textContent = t.experience.bands[e.id];
            g.appendChild(label);
            g.setAttribute('aria-label', t.experience.bands[e.id]);
            activate(g, function () { openExperience(e.item); });
            svg.appendChild(g);
        });

        placed.forEach(function (n) {
            var p = t.projects[n.p.key];
            var y = base - n.lane * LANE;
            var g = svgEl('g', { 'class': 'em-project', transform: 'translate(' + n.x + ' ' + y + ')' });
            g.appendChild(svgEl('circle', { r: 8 }));
            var label = svgEl('text', { x: 13, y: 5 });
            label.textContent = p.title.length > 26 ? p.title.slice(0, 25).trim() + '…' : p.title;
            g.appendChild(label);
            var tip = svgEl('title'); tip.textContent = p.title; g.appendChild(tip);
            g.setAttribute('aria-label', p.title);
            activate(g, function () { window.portfolioProjects.open(n.p.key); });
            svg.appendChild(g);
        });

        var hint = document.getElementById('experience-map-hint');
        if (hint) hint.textContent = t.experience.mapHint;
    }

    document.addEventListener('languageChanged', function () { setTimeout(render, 0); });
    document.addEventListener('DOMContentLoaded', render);
})();
