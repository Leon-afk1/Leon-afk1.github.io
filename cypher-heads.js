// Section openers: the Cypher query that would fetch the section from the knowledge graph.
// The query is in the HTML (readable without JS); when it first scrolls into view it is typed out once,
// then the result line ("n rows returned") appears. Respects prefers-reduced-motion.
(function () {
    'use strict';

    function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function highlight(src) {
        return escapeHtml(src)
            .replace(/"[^"]*"/g, '<span class="cy-str">$&</span>')
            .replace(/\b(MATCH|OPTIONAL|RETURN|ORDER BY|DESC|AS|WITH|collect|count)\b/g, '<span class="cy-kw">$1</span>')
            .replace(/:(Person|Project|Skill|Experience)\b/g, ':<span class="cy-label">$1</span>')
            .replace(/\[:(\w+)\]/g, '[:<span class="cy-rel">$1</span>]');
    }

    function result(head) {
        var t = window.translations && window.translations[window.currentLanguage === 'fr' ? 'fr' : 'en'];
        var out = head.querySelector('.cypher-result');
        if (out && t && t.cypher) out.textContent = t.cypher.rows.replace('{n}', head.dataset.rows);
    }

    function run(head) {
        var code = head.querySelector('code');
        var query = head.dataset.query;
        var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduce) { code.innerHTML = highlight(query); head.classList.add('is-done'); return; }
        var i = 0;
        (function type() {
            i = Math.min(query.length, i + 3);
            code.innerHTML = highlight(query.slice(0, i)) + (i < query.length ? '<span class="cy-caret"></span>' : '');
            if (i < query.length) setTimeout(type, 14);
            else head.classList.add('is-done');
        })();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var heads = Array.prototype.slice.call(document.querySelectorAll('.cypher-head'));
        heads.forEach(function (head) {
            var code = head.querySelector('code');
            head.dataset.query = code.textContent.trim();
            code.innerHTML = highlight(head.dataset.query);
            result(head);
        });
        if (!('IntersectionObserver' in window)) { heads.forEach(function (h) { h.classList.add('is-done'); }); return; }
        // Keep the final height while typing so the page does not jump
        heads.forEach(function (head) {
            var pre = head.querySelector('pre');
            pre.style.minHeight = pre.offsetHeight + 'px';
            head.querySelector('code').innerHTML = '<span class="cy-caret"></span>';
        });
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (!e.isIntersecting) return;
                observer.unobserve(e.target);
                run(e.target);
            });
        }, { threshold: 0.6 });
        heads.forEach(function (h) { observer.observe(h); });
    });
    document.addEventListener('languageChanged', function () {
        setTimeout(function () { document.querySelectorAll('.cypher-head').forEach(result); }, 0);
    });
})();
