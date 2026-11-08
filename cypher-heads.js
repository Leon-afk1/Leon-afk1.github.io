// Section openers: the Cypher query that would fetch the section from the knowledge graph, with its row count.
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

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.cypher-head').forEach(function (head) {
            var code = head.querySelector('code');
            code.innerHTML = highlight(code.textContent.trim());
            result(head);
        });
    });
    document.addEventListener('languageChanged', function () {
        setTimeout(function () { document.querySelectorAll('.cypher-head').forEach(result); }, 0);
    });
})();
