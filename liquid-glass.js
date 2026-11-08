// Refraction of the hero question capsule: the edge of the glass bends the graph behind it.
// Technique adapted from shuding/liquid-glass (MIT): an SVG displacement map used as a backdrop-filter.
// Only Chromium renders it; other browsers keep the blurred glass defined in hero.css.
(function () {
    'use strict';

    var SVG_NS = 'http://www.w3.org/2000/svg';
    var BAND = 26;      // width of the bending edge, in pixels
    var SCALE = 56;     // strength of the displacement

    function supported() {
        return window.CSS && CSS.supports('backdrop-filter', 'url(#x)') && /Chrom(e|ium)\//.test(navigator.userAgent);
    }

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    // Distance to the edge of a rounded rectangle (negative inside)
    function sdf(x, y, hw, hh, r) {
        var qx = Math.abs(x) - hw + r, qy = Math.abs(y) - hh + r;
        return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r;
    }

    function mapUrl(width, height, radius) {
        var w = Math.max(2, Math.round(width / 2)), h = Math.max(2, Math.round(height / 2));
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        var image = ctx.createImageData(w, h);
        var hw = width / 2, hh = height / 2;
        for (var j = 0; j < h; j++) {
            for (var i = 0; i < w; i++) {
                var x = (i + 0.5) * 2 - hw, y = (j + 0.5) * 2 - hh;
                var d = sdf(x, y, hw, hh, radius);
                var t = clamp(1 + d / BAND, 0, 1);
                var nx = sdf(x + 1, y, hw, hh, radius) - sdf(x - 1, y, hw, hh, radius);
                var ny = sdf(x, y + 1, hw, hh, radius) - sdf(x, y - 1, hw, hh, radius);
                var len = Math.hypot(nx, ny) || 1;
                var push = t * t;
                var k = (j * w + i) * 4;
                image.data[k] = 127.5 - (nx / len) * push * 127.5;
                image.data[k + 1] = 127.5 - (ny / len) * push * 127.5;
                image.data[k + 2] = 127;
                image.data[k + 3] = 255;
            }
        }
        ctx.putImageData(image, 0, 0);
        return canvas.toDataURL();
    }

    function node(name, attrs, parent) {
        var e = document.createElementNS(SVG_NS, name);
        Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        if (parent) parent.appendChild(e);
        return e;
    }

    function attach(el, id) {
        var svg = node('svg', { width: 0, height: 0, 'aria-hidden': 'true', style: 'position:absolute' }, document.body);
        var filter = node('filter', { id: id, filterUnits: 'userSpaceOnUse', 'color-interpolation-filters': 'sRGB', x: 0, y: 0 }, svg);
        var image = node('feImage', { x: 0, y: 0, preserveAspectRatio: 'none', result: 'map' }, filter);
        node('feDisplacementMap', { 'in': 'SourceGraphic', in2: 'map', xChannelSelector: 'R', yChannelSelector: 'G', scale: SCALE }, filter);

        var width = 0, height = 0;
        function update() {
            var w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
            if (!w || !h || (w === width && h === height)) return;
            width = w;
            height = h;
            filter.setAttribute('width', w);
            filter.setAttribute('height', h);
            image.setAttribute('width', w);
            image.setAttribute('height', h);
            image.setAttribute('href', mapUrl(w, h, parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0));
        }
        update();
        new ResizeObserver(update).observe(el);
        el.style.backdropFilter = 'url(#' + id + ') blur(7px) saturate(1.35)';
    }

    document.addEventListener('DOMContentLoaded', function () {
        var capsule = document.getElementById('hero-ask');
        if (capsule && supported()) attach(capsule, 'hero-ask-glass');
    });
})();
