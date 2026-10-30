// Experience timeline, rendered from texte.json (experience.itemN: title, company, period, achievementN,
// reportText/reportUrl). One entry open at a time; headers act as buttons.
// The order matters: experience-graph.js opens entries by their index.
(function () {
    'use strict';

    var ITEMS = [
        { key: 'item0', current: true },   // Astek
        { key: 'item1' },                  // UQAC
        { key: 'item2' },                  // Hackathon
        { key: 'item3' },                  // UTBM
        { key: 'item4', report: true },    // Ksilink
        { key: 'item5' }                   // Yeditepe
    ];
    var openIndex = 0;

    function el(tag, className, text) {
        var e = document.createElement(tag);
        if (className) e.className = className;
        if (text != null) e.textContent = text;
        return e;
    }

    function achievements(item) {
        return Object.keys(item).filter(function (k) { return /^achievement\d+$/.test(k); })
            .sort(function (a, b) { return a.slice(11) - b.slice(11); })
            .map(function (k) { return item[k]; });
    }

    function setOpen(index) {
        openIndex = index;
        document.querySelectorAll('.timeline-item').forEach(function (item, i) {
            item.classList.toggle('is-open', i === index);
            item.querySelector('.tl-header').setAttribute('aria-expanded', String(i === index));
        });
    }

    function render() {
        var all = window.translations && window.translations[window.currentLanguage];
        var host = document.getElementById('timeline');
        if (!all || !host) return;
        var t = all.experience;
        host.innerHTML = '';

        ITEMS.forEach(function (cfg, index) {
            var data = t[cfg.key];
            var item = el('div', 'timeline-item');
            item.appendChild(el('div', 'timeline-marker'));
            var content = el('div', 'timeline-content');

            var header = el('div', 'tl-header');
            header.setAttribute('role', 'button');
            header.setAttribute('tabindex', '0');
            header.setAttribute('aria-controls', 'tl-body-' + index);
            header.appendChild(el('h3', null, data.title));
            header.appendChild(el('p', 'company', data.company));
            header.appendChild(el('p', 'period', data.period));
            if (cfg.current) header.appendChild(el('span', 'tl-badge', t.current));
            header.addEventListener('click', function () { setOpen(openIndex === index ? -1 : index); });
            header.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); header.click(); }
            });

            var body = el('div', 'tl-body');
            body.id = 'tl-body-' + index;
            var list = el('ul', 'achievements');
            achievements(data).forEach(function (a) { list.appendChild(el('li', null, a)); });
            body.appendChild(list);
            if (cfg.report && data.reportUrl) {
                var links = el('div', 'experience-links');
                var a = el('a', 'project-link internship-report-link', data.reportText);
                a.href = data.reportUrl;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                links.appendChild(a);
                body.appendChild(links);
            }

            content.appendChild(header);
            content.appendChild(body);
            item.appendChild(content);
            host.appendChild(item);
        });
        setOpen(openIndex);
    }

    document.addEventListener('languageChanged', function () { setTimeout(render, 0); });
})();
