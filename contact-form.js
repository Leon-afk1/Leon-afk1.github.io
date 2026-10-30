// Contact form: sends to Formspree and shows the result under the form
(function () {
    'use strict';

    function texts() {
        var t = window.translations && window.translations[window.currentLanguage];
        return (t && t.contact && t.contact.form) || {};
    }

    function showStatus(box, className, message) {
        box.innerHTML = '';
        var div = document.createElement('div');
        div.className = className;
        div.textContent = message;   // Formspree error messages are shown as text, never as HTML
        box.appendChild(div);
    }

    document.addEventListener('DOMContentLoaded', function () {
        var form = document.getElementById('contact-form');
        var submitBtn = document.getElementById('submit-btn');
        var status = document.getElementById('form-status');
        if (!form || !submitBtn || !status) return;
        var btnText = submitBtn.querySelector('.btn-text');
        var btnLoading = submitBtn.querySelector('.btn-loading');

        function setLoading(loading) {
            btnText.style.display = loading ? 'none' : 'inline';
            btnLoading.style.display = loading ? 'inline' : 'none';
            submitBtn.disabled = loading;
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            setLoading(true);
            status.innerHTML = '';
            fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
                .then(function (response) {
                    if (response.ok) {
                        showStatus(status, 'form-success', texts().successMessage || '✓ Message sent.');
                        form.reset();
                        return;
                    }
                    return response.json().then(function (data) {
                        if (!data.errors) throw new Error('Form submission failed');
                        showStatus(status, 'form-error', '✗ ' + data.errors.map(function (err) { return err.message; }).join(', '));
                    });
                })
                .catch(function (error) {
                    console.error('Form submission error:', error);
                    showStatus(status, 'form-error', texts().errorMessage || '✗ Something went wrong. Please email me directly.');
                })
                .then(function () { setLoading(false); });
        });
    });
})();
