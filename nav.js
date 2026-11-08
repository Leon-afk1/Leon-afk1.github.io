// Top navigation: mobile menu, smooth scrolling to sections, active link
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        var navToggle = document.querySelector('.nav-toggle');
        var navMenu = document.querySelector('.nav-menu');
        var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        var sections = document.querySelectorAll('section[id]');

        // Position in the page: offsetTop is relative to the nearest positioned parent (About and Contact have one)
        function pageTop(element) { return element.getBoundingClientRect().top + window.scrollY; }

        function closeMenu() {
            if (!navToggle || !navMenu) return;
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('nav-open');
        }

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', function () {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
                document.body.classList.toggle('nav-open');
            });
            document.addEventListener('click', function (e) {
                if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) closeMenu();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && navMenu.classList.contains('active')) closeMenu();
            });
        }

        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                var target = document.getElementById(link.getAttribute('href').slice(1));
                closeMenu();
                if (!target) return;
                e.preventDefault();
                // Account for the fixed navigation bar
                window.scrollTo({ top: pageTop(target) - 70, behavior: 'smooth' });
            });
        });

        function onScroll() {
            var position = window.scrollY + 100;
            var current = '';
            sections.forEach(function (section) {
                var top = pageTop(section) - 100;
                if (position >= top && position < top + section.offsetHeight) current = section.id;
            });
            navLinks.forEach(function (link) {
                link.classList.toggle('active', link.getAttribute('href') === '#' + current);
            });
        }

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();

        // The hero has its own question box: the floating assistant waits below it.
        // It is visible by default and hidden only while the hero is seen on screen.
        var hero = document.getElementById('home');
        if (hero && 'IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                document.body.classList.toggle('on-hero', entries[0].intersectionRatio >= 0.4);
            }, { threshold: [0, 0.4, 1] }).observe(hero);
        }
    });
})();
