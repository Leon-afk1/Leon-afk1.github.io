// WebGL light of the hero and liquid-metal monogram of the navigation. No dependency.
// Both are still at rest: the field moves only while a question is being answered, then keeps the colours
// of the nodes cited in the answer; the monogram moves only while it is hovered.
// With prefers-reduced-motion the colours change without animation. Without WebGL the CSS background stays.
// The look follows ShaderGradient and paper-design/liquid-logo; the shaders are written for this site.
(function () {
    'use strict';

    var VERTEX = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}';

    var FIELD = [
        'precision highp float;',
        'uniform vec2 uRes;uniform float uTime;uniform vec3 uTint;uniform float uGlow;',
        'float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
        'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);',
        'return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
        'float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}',
        'void main(){',
        'vec2 uv=gl_FragCoord.xy/uRes;vec2 p=uv*vec2(uRes.x/uRes.y,1.)*1.7;float t=uTime*.16;',
        'vec2 q=vec2(fbm(p+vec2(t,0.)),fbm(p+vec2(5.2,1.3-t)));',
        'float f=fbm(p+2.2*q);',
        'vec3 base=mix(vec3(.078,.102,.149),vec3(.133,.165,.224),smoothstep(.25,.8,f));',
        'vec3 tint=uTint.x*vec3(.365,.733,.541)+uTint.y*vec3(.424,.706,.961)+uTint.z*vec3(.725,.639,.961);',
        'float area=smoothstep(.3,.9,f)*smoothstep(1.15,.15,distance(uv,vec2(.68,.42)));',
        'vec3 c=base+tint*area*(.2+.2*uGlow);',
        'c+=(hash(gl_FragCoord.xy)-.5)/128.;',
        'gl_FragColor=vec4(c,1.);}'
    ].join('');

    var METAL = [
        'precision highp float;varying vec2 v;',
        'uniform sampler2D uMask;uniform float uTime;uniform float uTexel;',
        'void main(){',
        'vec2 uv=vec2(v.x,v.y);vec4 m=texture2D(uMask,uv);float a=m.r;float ivy=m.b;',
        'float x=texture2D(uMask,uv+vec2(uTexel,0.)).g-texture2D(uMask,uv-vec2(uTexel,0.)).g;',
        'float y=texture2D(uMask,uv+vec2(0.,uTexel)).g-texture2D(uMask,uv-vec2(0.,uTexel)).g;',
        'float w=uv.x*.55+uv.y*.9+x*2.6+y*3.4+sin(uv.x*7.+uTime*1.5)*.05+uTime*.2;float b=fract(w*1.9);',
        'vec3 dark=vec3(.34,.4,.5),mid=vec3(.74,.8,.87),hi=vec3(1.);',
        'vec3 c=b<.4?mix(dark,mid,b/.4):b<.6?mix(mid,hi,(b-.4)/.2):b<.8?mix(hi,mid,(b-.6)/.2):mix(mid,dark,(b-.8)/.2);',
        'float g=.5+.5*sin(w*16.+uv.y*11.);vec3 leaf=mix(vec3(.15,.48,.33),vec3(.6,.9,.7),g);',
        'c=mix(c,leaf,ivy);float alpha=max(a,ivy);gl_FragColor=vec4(c*alpha,alpha);}'
    ].join('');

    function reduceMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

    function program(gl, fragment) {
        function shader(type, source) {
            var s = gl.createShader(type);
            gl.shaderSource(s, source);
            gl.compileShader(s);
            return s;
        }
        var p = gl.createProgram();
        gl.attachShader(p, shader(gl.VERTEX_SHADER, VERTEX));
        gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragment));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
        gl.useProgram(p);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
        var loc = gl.getAttribLocation(p, 'p');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
        return p;
    }

    // ---------- Hero field

    var IDLE = [0.16, 0.2, 0.16];

    function createField(canvas) {
        var gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
        var p = gl && program(gl, FIELD);
        if (!p) return null;
        var u = {};
        ['uRes', 'uTime', 'uTint', 'uGlow'].forEach(function (n) { u[n] = gl.getUniformLocation(p, n); });

        var cur = { tint: IDLE.slice(), glow: 0 }, target = { tint: IDLE, glow: 0 };
        var time = 11, busy = false, raf = 0, last = 0;

        function draw() {
            gl.uniform2f(u.uRes, canvas.width, canvas.height);
            gl.uniform1f(u.uTime, time);
            gl.uniform3f(u.uTint, cur.tint[0], cur.tint[1], cur.tint[2]);
            gl.uniform1f(u.uGlow, cur.glow);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        function resize() {
            var scale = Math.min(window.devicePixelRatio || 1, 1) * 0.7;
            var w = Math.max(2, Math.round(canvas.clientWidth * scale)), h = Math.max(2, Math.round(canvas.clientHeight * scale));
            if (canvas.width === w && canvas.height === h) return;
            canvas.width = w;
            canvas.height = h;
            gl.viewport(0, 0, w, h);
            draw();
        }

        function settled() {
            return Math.abs(cur.glow - target.glow) < 0.004 && cur.tint.every(function (v, i) { return Math.abs(v - target.tint[i]) < 0.004; });
        }

        function frame(now) {
            var dt = Math.min(48, now - last) / 1000;
            last = now;
            var k = 1 - Math.exp(-dt * 3.2);
            if (busy) time += dt;
            cur.glow += (target.glow - cur.glow) * k;
            cur.tint = cur.tint.map(function (v, i) { return v + (target.tint[i] - v) * k; });
            draw();
            raf = busy || !settled() ? requestAnimationFrame(frame) : 0;
        }

        function update() {
            if (reduceMotion()) {
                cur.glow = target.glow;
                cur.tint = target.tint.slice();
                draw();
                return;
            }
            if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        }

        resize();
        new ResizeObserver(resize).observe(canvas);
        canvas.classList.add('is-ready');

        return {
            // Waiting for an answer: the only moment when the field flows
            busy: function (on) {
                busy = on;
                target.glow = on ? 0.55 : target.tint === IDLE ? 0 : 0.8;
                update();
            },
            // counts = { project, skill, experience }: how many cited nodes of each kind
            cite: function (counts) {
                var total = counts.project + counts.skill + counts.experience;
                target.tint = total ? [counts.project / total, counts.skill / total, counts.experience / total] : IDLE;
                target.glow = total ? 0.8 : 0;
                update();
            }
        };
    }

    // ---------- Monogram

    // Ivy climbing the legs of the letters: a wavy stem with heart-shaped leaves on alternate sides
    function ivyLayer(size) {
        var c = document.createElement('canvas');
        c.width = c.height = size;
        var x = c.getContext('2d');
        x.fillStyle = x.strokeStyle = '#fff';
        x.lineCap = 'round';

        function leaf(px, py, r, angle) {
            x.save();
            x.translate(px, py);
            x.rotate(angle);
            x.beginPath();
            x.moveTo(0, r * 0.9);
            x.bezierCurveTo(-r * 1.1, r * 0.45, -r * 1.15, -r * 0.3, -r * 0.42, -r * 0.3);
            x.quadraticCurveTo(-r * 0.2, -r * 0.8, 0, -r * 1.1);
            x.quadraticCurveTo(r * 0.2, -r * 0.8, r * 0.42, -r * 0.3);
            x.bezierCurveTo(r * 1.15, -r * 0.3, r * 1.1, r * 0.45, 0, r * 0.9);
            x.fill();
            x.restore();
        }

        // [x start, x end, y end (top), phase]
        [[0.1, 0.17, 0.24, 0.4], [0.45, 0.5, 0.2, 2.1], [0.87, 0.93, 0.28, 4.2]].forEach(function (v) {
            function at(t) {
                return { x: size * (v[0] + (v[1] - v[0]) * t + 0.022 * Math.sin(t * 10 + v[3])), y: size * (0.9 + (v[2] - 0.9) * t) };
            }
            x.lineWidth = size * 0.02;
            x.beginPath();
            for (var i = 0; i <= 40; i++) {
                var p = at(i / 40);
                if (i) x.lineTo(p.x, p.y); else x.moveTo(p.x, p.y);
            }
            x.stroke();
            for (var k = 1; k <= 6; k++) {
                var q = at(k / 6.2), side = k % 2 ? 1 : -1;
                leaf(q.x + side * size * 0.04, q.y, size * (0.052 - k * 0.003), side * 1.0);
            }
        });
        return x.getImageData(0, 0, size, size).data;
    }

    // The tab icon is the same drawing, on the page's background so it reads on any browser theme
    function setFavicon(source) {
        var link = document.querySelector('link[rel="icon"]');
        if (!link) return;
        var c = document.createElement('canvas');
        c.width = c.height = 64;
        var x = c.getContext('2d');
        x.fillStyle = '#161C28';
        x.beginPath();
        if (x.roundRect) x.roundRect(0, 0, 64, 64, 14); else x.rect(0, 0, 64, 64);
        x.fill();
        x.drawImage(source, 0, 0, 64, 64);
        link.type = 'image/png';
        link.href = c.toDataURL('image/png');
    }

    function buildMask(size) {
        function layer(blur) {
            var c = document.createElement('canvas');
            c.width = c.height = size;
            var x = c.getContext('2d');
            if (blur && 'filter' in x) x.filter = 'blur(' + blur + 'px)';
            x.fillStyle = '#fff';
            x.font = '800 ' + Math.round(size * 0.62) + 'px "Schibsted Grotesk", sans-serif';
            x.textAlign = 'center';
            x.textBaseline = 'middle';
            x.fillText('LM', size / 2, size * 0.54);
            return x.getImageData(0, 0, size, size).data;
        }
        var sharp = layer(0), soft = layer(size / 22), ivy = ivyLayer(size);
        var out = new Uint8Array(size * size * 4);
        for (var i = 0; i < out.length; i += 4) {
            out[i] = sharp[i + 3];
            out[i + 1] = soft[i + 3];
            out[i + 2] = ivy[i + 3];
            out[i + 3] = 255;
        }
        return out;
    }

    function createMark(canvas) {
        var size = 128;
        canvas.width = canvas.height = size;
        var gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true });
        var p = gl && program(gl, METAL);
        if (!p) return;
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildMask(size));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.uniform1f(gl.getUniformLocation(p, 'uTexel'), 2 / size);
        var uTime = gl.getUniformLocation(p, 'uTime');

        var time = 1.2, hovering = false, raf = 0, last = 0;
        function draw() {
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.uniform1f(uTime, time);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }
        function frame(now) {
            time += Math.min(48, now - last) / 1000;
            last = now;
            draw();
            raf = hovering ? requestAnimationFrame(frame) : 0;
        }
        draw();
        setFavicon(canvas);   // right after drawing: the WebGL buffer is cleared at the end of the task
        canvas.parentNode.classList.add('has-gl');

        var host = canvas.parentNode;
        function set(on) {
            hovering = on && !reduceMotion();
            if (hovering && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
        }
        host.addEventListener('mouseenter', function () { set(true); });
        host.addEventListener('mouseleave', function () { set(false); });
        host.addEventListener('focus', function () { set(true); });
        host.addEventListener('blur', function () { set(false); });
    }

    var field = null;
    window.fieldShader = {
        busy: function (on) { if (field) field.busy(on); },
        cite: function (counts) { if (field) field.cite(counts); }
    };

    document.addEventListener('DOMContentLoaded', function () {
        var canvas = document.getElementById('hero-field');
        try {
            if (canvas) field = createField(canvas);
        } catch (e) { field = null; }

        var mark = document.getElementById('liquid-mark');
        if (!mark || !document.fonts) return;
        document.fonts.load('800 80px "Schibsted Grotesk"').then(function () {
            try { createMark(mark); } catch (e) { /* the text monogram stays */ }
        });
    });
})();
