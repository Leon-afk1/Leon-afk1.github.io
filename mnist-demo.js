// MNIST demo: draw a digit, preview the 28x28 input, run the PyTorch CNN exported to ONNX in the browser.
// ONNX Runtime Web (window.loadOrt, enhancements.js) and the model load only when the demo nears the viewport.
// If the model cannot run, the table says so: no made-up predictions.
(function () {
    'use strict';

    var MEAN = 0.1307, STD = 0.3081;   // MNIST normalization used at training time

    function texts() {
        var t = window.translations && window.translations[window.currentLanguage];
        return (t && t.mnistDemo) || {};
    }

    document.addEventListener('DOMContentLoaded', function () {
        var canvas = document.getElementById('drawingCanvas');
        var previewCanvas = document.getElementById('previewCanvas');
        var clearBtn = document.getElementById('clearCanvas');
        var predictBtn = document.getElementById('predictDigit');
        var table = document.getElementById('predictionTable');
        if (!canvas || !previewCanvas || !clearBtn || !predictBtn || !table) return;

        var ctx = canvas.getContext('2d', { willReadFrequently: true });
        var previewCtx = previewCanvas.getContext('2d');
        var isDrawing = false;
        var model = null;
        var modelPromise = null;
        var previewTimeout = null;

        function initCanvas() {
            // White drawing canvas, black preview canvas (MNIST format: white digit on black)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 22;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            updatePreview();
        }

        function showMessage(message, className) {
            table.innerHTML = '';
            var row = document.createElement('div');
            row.className = 'prediction-row';
            var span = document.createElement('span');
            span.className = 'digit ' + (className || 'prediction-placeholder');
            span.textContent = message;
            row.appendChild(span);
            table.appendChild(row);
        }

        function showPredictions(predictions) {
            table.innerHTML = '';
            predictions.forEach(function (pred, index) {
                var row = document.createElement('div');
                row.className = 'prediction-row' + (index === 0 ? ' top-prediction' : '');
                var pct = (pred.confidence * 100).toFixed(1);
                row.innerHTML = '<span class="digit">' + pred.digit + '</span>' +
                    '<div class="confidence-bar"><div class="confidence-fill" style="width: ' + pct + '%"></div></div>' +
                    '<span class="confidence">' + pct + '%</span>';
                table.appendChild(row);
            });
        }

        // ---------- Drawing (mouse and touch)

        function point(clientX, clientY) {
            var rect = canvas.getBoundingClientRect();
            return { x: (clientX - rect.left) * canvas.width / rect.width, y: (clientY - rect.top) * canvas.height / rect.height };
        }

        function strokeTo(p) {
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            if (previewTimeout) clearTimeout(previewTimeout);
            previewTimeout = setTimeout(updatePreview, 100);
        }

        function start(p) { isDrawing = true; ctx.beginPath(); ctx.moveTo(p.x, p.y); strokeTo(p); }
        function stop() {
            if (!isDrawing) return;
            isDrawing = false;
            ctx.beginPath();
            updatePreview();
        }

        canvas.addEventListener('mousedown', function (e) { start(point(e.clientX, e.clientY)); });
        canvas.addEventListener('mousemove', function (e) { if (isDrawing) strokeTo(point(e.clientX, e.clientY)); });
        canvas.addEventListener('mouseup', stop);
        canvas.addEventListener('mouseout', stop);
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            if (e.touches.length === 1) start(point(e.touches[0].clientX, e.touches[0].clientY));
        }, { passive: false });
        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            if (isDrawing && e.touches.length === 1) strokeTo(point(e.touches[0].clientX, e.touches[0].clientY));
        }, { passive: false });
        canvas.addEventListener('touchend', function (e) { e.preventDefault(); stop(); }, { passive: false });

        // ---------- Preprocessing: crop the digit, square it, resize to 28x28, normalize like at training time

        function preprocess() {
            var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            var gray = new Array(canvas.width * canvas.height);
            var minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0, hasContent = false;
            for (var y = 0; y < canvas.height; y++) {
                for (var x = 0; x < canvas.width; x++) {
                    var idx = (y * canvas.width + x) * 4;
                    // Invert: black pen on white -> white digit on black
                    var g = 255 - (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                    gray[y * canvas.width + x] = g;
                    if (g > 50) {
                        hasContent = true;
                        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
                    }
                }
            }
            if (!hasContent) return null;

            var padding = 20;
            minX = Math.max(0, minX - padding); maxX = Math.min(canvas.width - 1, maxX + padding);
            minY = Math.max(0, minY - padding); maxY = Math.min(canvas.height - 1, maxY + padding);
            var w = maxX - minX + 1, h = maxY - minY + 1, size = Math.max(w, h);
            var cropX = minX - (size - w) / 2, cropY = minY - (size - h) / 2;

            var result = new Array(784);
            for (var j = 0; j < 28; j++) {
                for (var i = 0; i < 28; i++) {
                    var sx = Math.round(cropX + (i / 27) * (size - 1));
                    var sy = Math.round(cropY + (j / 27) * (size - 1));
                    var v = (sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) ? gray[sy * canvas.width + sx] : 0;
                    result[j * 28 + i] = (v / 255 - MEAN) / STD;
                }
            }
            return result;
        }

        function updatePreview() {
            var data = preprocess();
            var image = previewCtx.createImageData(140, 140);
            for (var y = 0; y < 28; y++) {
                for (var x = 0; x < 28; x++) {
                    var value = data ? Math.max(0, Math.min(1, data[y * 28 + x] * STD + MEAN)) : 0;
                    var grayValue = Math.round(value * 255);
                    for (var dy = 0; dy < 5; dy++) {
                        for (var dx = 0; dx < 5; dx++) {
                            var p = ((y * 5 + dy) * 140 + (x * 5 + dx)) * 4;
                            image.data[p] = image.data[p + 1] = image.data[p + 2] = grayValue;
                            image.data[p + 3] = 255;
                        }
                    }
                }
            }
            previewCtx.putImageData(image, 0, 0);
        }

        // ---------- Model

        function loadModel() {
            if (!modelPromise) {
                modelPromise = window.loadOrt()
                    .then(function (ort) { return ort.InferenceSession.create('./mnist_model.onnx'); })
                    .then(function (session) { model = session; return session; })
                    .catch(function (error) {
                        console.error('MNIST model failed to load:', error);
                        modelPromise = null;   // allow a new attempt
                        throw error;
                    });
            }
            return modelPromise;
        }

        function predict(input) {
            var tensor = new window.ort.Tensor('float32', new Float32Array(input), [1, 1, 28, 28]);
            var feeds = {};
            feeds[model.inputNames[0]] = tensor;
            return model.run(feeds).then(function (outputs) {
                var logits = Array.from(outputs[model.outputNames[0]].data);
                var max = Math.max.apply(null, logits);
                var exps = logits.map(function (v) { return Math.exp(v - max); });
                var sum = exps.reduce(function (a, b) { return a + b; }, 0);
                return exps.map(function (v, digit) { return { digit: digit, confidence: v / sum }; })
                    .sort(function (a, b) { return b.confidence - a.confidence; })
                    .slice(0, 5);
            });
        }

        clearBtn.addEventListener('click', function () {
            initCanvas();
            showMessage(texts().predictionPlaceholder || 'Draw a digit to see predictions');
            predictBtn.disabled = false;
        });

        predictBtn.addEventListener('click', function () {
            var t = texts();
            var input = preprocess();
            if (!input) { showMessage(t.drawFirst || 'Draw a digit first.'); return; }
            predictBtn.textContent = t.predictingButton || 'Predicting...';
            predictBtn.disabled = true;
            loadModel()
                .then(function () { return predict(input); })
                .then(showPredictions, function (error) {
                    console.error('MNIST prediction failed:', error);
                    showMessage(model ? (t.predictError || 'The prediction failed.') : (t.modelError || 'The model could not be loaded.'), 'prediction-error');
                })
                .then(function () {
                    predictBtn.textContent = texts().predictButton || 'Predict';
                    predictBtn.disabled = false;
                });
        });

        initCanvas();

        // Load ONNX Runtime and the model only when the demo nears the viewport (or on first touch of the canvas)
        var section = document.getElementById('mnist-demo');
        function warmUp() { loadModel().catch(function () {}); }
        if ('IntersectionObserver' in window && section) {
            new IntersectionObserver(function (entries, observer) {
                if (entries.some(function (e) { return e.isIntersecting; })) { observer.disconnect(); warmUp(); }
            }, { rootMargin: '400px' }).observe(section);
        } else {
            warmUp();
        }
        canvas.addEventListener('pointerdown', warmUp, { once: true });
    });
})();
