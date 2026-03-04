// Neural Network Portfolio - Interactive Visualization
class NeuralNetwork {
    constructor() {
        this.canvas = document.getElementById('neuralCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodesOverlay = document.getElementById('neuralNodesOverlay');
        this.contentOverlay = document.getElementById('neuralContentOverlay');
        this.bubbleContent = document.getElementById('neuralBubbleContent');
        
        this.nodes = [];
        this.connections = [];
        this.activeNode = null;
        this.animationFrame = null;
        this.particles = [];
        this.orientation = 'horizontal'; // 'horizontal' or 'vertical'
        
        this.init();
    }
    
    init() {
        this.resizeCanvas();
        this.createNodes();
        this.createConnections();
        this.createNodeLabels();
        this.animate();
        this.setupEventListeners();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        
        // In vertical mode (mobile), ensure enough height for all layers
        const newOrientation = container.clientWidth < 768 ? 'vertical' : 'horizontal';
        if (newOrientation === 'vertical') {
            // Need more height for vertical layout (4 layers stacked)
            const minHeight = Math.max(container.clientHeight, 800);
            this.canvas.height = minHeight;
            container.style.minHeight = `${minHeight}px`;
        } else {
            this.canvas.height = container.clientHeight;
            container.style.minHeight = '';
        }
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Determine orientation based on screen width
        const orientationChanged = newOrientation !== this.orientation;
        this.orientation = newOrientation;
        
        // Always recalculate positions on resize (canvas dimensions changed)
        if (this.nodes.length > 0) {
            this.repositionNodes();
            this.updateNodeLabelPositions();
        }
    }
    
    createNodes() {
        // Define technical skills as neural network nodes (based on real projects)
        // Layer 1: Foundational tools used in every project
        // Layer 2: ML Frameworks that depend on foundations
        // Layer 3: Application domains that use frameworks
        // Layer 4: Production/deployment tools
        const nodeData = [
            // Layer 1: Foundation
            { id: 'python', title: 'Python', abbr: 'PY', layer: 1, color: '#4a90e2' },
            { id: 'dataproc', title: 'Data Processing', abbr: 'DATA', layer: 1, color: '#4a90e2' },
            { id: 'git', title: 'Git/GitHub', abbr: 'GIT', layer: 1, color: '#4a90e2' },
            
            // Layer 2: ML Frameworks
            { id: 'pytorch', title: 'PyTorch', abbr: 'PT', layer: 2, color: '#4a90e2' },
            { id: 'tf', title: 'TensorFlow', abbr: 'TF', layer: 2, color: '#4a90e2' },
            { id: 'sklearn', title: 'Scikit-learn', abbr: 'SK', layer: 2, color: '#4a90e2' },
            { id: 'hf', title: 'Hugging Face', abbr: 'HF', layer: 2, color: '#4a90e2' },
            
            // Layer 3: Application Domains
            { id: 'nlp', title: 'NLP & LLM', abbr: 'NLP', layer: 3, color: '#4a90e2' },
            { id: 'cv', title: 'Computer Vision', abbr: 'CV', layer: 3, color: '#4a90e2' },
            { id: 'timeseries', title: 'Time Series', abbr: 'TS', layer: 3, color: '#4a90e2' },
            
            // Layer 4: Production Tools
            { id: 'fastapi', title: 'FastAPI', abbr: 'API', layer: 4, color: '#4a90e2' },
            { id: 'streamlit', title: 'Streamlit', abbr: 'ST', layer: 4, color: '#4a90e2' },
            { id: 'neo4j', title: 'Neo4j', abbr: 'N4J', layer: 4, color: '#4a90e2' },
            { id: 'docker', title: 'Docker', abbr: 'DK', layer: 4, color: '#4a90e2' }
        ];
        
        // Calculate positions based on layers and orientation
        const layers = {};
        nodeData.forEach(node => {
            if (!layers[node.layer]) layers[node.layer] = [];
            layers[node.layer].push(node);
        });
        
        this.calculatePositions(layers);
    }
    
    calculatePositions(layers) {
        const maxLayers = Math.max(...Object.keys(layers).map(Number));
        
        if (this.orientation === 'horizontal') {
            // Horizontal layout: layers go left to right
            const marginX = 150;
            const marginY = 250;
            const layerWidth = (this.width - 2 * marginX) / maxLayers;
            
            Object.entries(layers).forEach(([layer, nodesInLayer]) => {
                const layerHeight = this.height - 2 * marginY;
                const nodeSpacing = 160;  // Fixed spacing for uniform appearance
                
                const totalHeight = nodeSpacing * (nodesInLayer.length - 1);
                const startY = (this.height - totalHeight) / 2;
                
                nodesInLayer.forEach((node, index) => {
                    const existingNode = this.nodes.find(n => n.id === node.id);
                    const nodeObj = {
                        ...node,
                        x: marginX + layerWidth * (parseInt(layer) - 0.5),
                        y: nodesInLayer.length === 1 ? this.height / 2 : startY + nodeSpacing * index,
                        radius: 40,
                        pulsePhase: existingNode ? existingNode.pulsePhase : Math.random() * Math.PI * 2,
                        connections: existingNode ? existingNode.connections : [],
                        expanded: existingNode ? existingNode.expanded : false
                    };
                    
                    if (existingNode) {
                        Object.assign(existingNode, nodeObj);
                    } else {
                        this.nodes.push(nodeObj);
                    }
                });
            });
        } else {
            // Vertical layout: layers go top to bottom (for mobile)
            const marginX = 30;  // Reduced margins for mobile
            const marginY = 100;
            const layerHeight = (this.height - 2 * marginY) / maxLayers;
            
            Object.entries(layers).forEach(([layer, nodesInLayer]) => {
                const layerWidth = this.width - 2 * marginX;
                const nodeSpacing = 65;  // Fixed spacing for uniform appearance on mobile
                
                const totalWidth = nodeSpacing * (nodesInLayer.length - 1);
                const startX = (this.width - totalWidth) / 2;
                
                nodesInLayer.forEach((node, index) => {
                    const existingNode = this.nodes.find(n => n.id === node.id);
                    const nodeObj = {
                        ...node,
                        x: nodesInLayer.length === 1 ? this.width / 2 : startX + nodeSpacing * index,
                        y: marginY + layerHeight * (parseInt(layer) - 0.5),
                        radius: 30,  // Match CSS node-label-inner size (60px diameter = 30px radius)
                        pulsePhase: existingNode ? existingNode.pulsePhase : Math.random() * Math.PI * 2,
                        connections: existingNode ? existingNode.connections : [],
                        expanded: existingNode ? existingNode.expanded : false
                    };
                    
                    if (existingNode) {
                        Object.assign(existingNode, nodeObj);
                    } else {
                        this.nodes.push(nodeObj);
                    }
                });
            });
        }
    }
    
    repositionNodes() {
        // Reorganize layers from existing nodes
        const layers = {};
        this.nodes.forEach(node => {
            if (!layers[node.layer]) layers[node.layer] = [];
            layers[node.layer].push(node);
        });
        
        this.calculatePositions(layers);
    }
    
    updateNodeLabels() {
        // Update label positions
        this.nodes.forEach(node => {
            if (node.labelElement) {
                node.labelElement.style.left = `${node.x}px`;
                node.labelElement.style.top = `${node.y}px`;
            }
        });
    }
    
    createConnections() {
        // Create logical connections between related skills (based on real projects)
        // Hierarchical structure: Foundation → Frameworks → Domains → Production
        const connections = [
            // Layer 1 to Layer 2: Foundation enables Frameworks
            ['python', 'pytorch'],
            ['python', 'tf'],
            ['python', 'sklearn'],
            ['python', 'hf'],
            ['dataproc', 'pytorch'],
            ['dataproc', 'tf'],
            ['dataproc', 'sklearn'],
            ['git', 'pytorch'],
            ['git', 'tf'],
            
            // Layer 2 to Layer 3: Frameworks enable Domains
            ['pytorch', 'cv'],
            ['pytorch', 'nlp'],
            ['pytorch', 'timeseries'],
            ['tf', 'cv'],
            ['tf', 'nlp'],
            ['tf', 'timeseries'],
            ['sklearn', 'timeseries'],
            ['sklearn', 'nlp'],
            ['hf', 'nlp'],
            
            // Layer 3 to Layer 4: Domains deployed via Production tools
            ['cv', 'fastapi'],
            ['cv', 'streamlit'],
            ['nlp', 'fastapi'],
            ['nlp', 'streamlit'],
            ['nlp', 'neo4j'],
            ['nlp', 'docker'],
            ['timeseries', 'streamlit']
        ];
        
        // Create connections without duplicates
        const connectionSet = new Set();
        connections.forEach(([fromId, toId]) => {
            const fromNode = this.nodes.find(n => n.id === fromId);
            const toNode = this.nodes.find(n => n.id === toId);
            
            if (fromNode && toNode) {
                const key = `${fromId}-${toId}`;
                if (!connectionSet.has(key)) {
                    connectionSet.add(key);
                    this.connections.push({
                        from: fromNode,
                        to: toNode,
                        strength: 0,
                        baseStrength: 0.15 + Math.random() * 0.1,
                        active: false
                    });
                }
            }
        });
    }
    
    createNodeLabels() {
        this.nodes.forEach(node => {
            const label = document.createElement('div');
            label.className = 'neural-node-label';
            label.dataset.nodeId = node.id;
            label.innerHTML = `
                <div class="neural-node-label-inner" style="border-color: ${node.color}">
                    <div class="neural-node-abbr" style="color: ${node.color}">${node.abbr}</div>
                    <div class="neural-node-title">${node.title}</div>
                </div>
            `;
            
            // Hover triggers propagation
            label.addEventListener('mouseenter', () => {
                this.propagateSignal(node);
            });
            
            // Click shows content
            label.addEventListener('click', () => this.onNodeClick(node));
            
            this.nodesOverlay.appendChild(label);
            node.labelElement = label;
        });
        
        this.updateNodeLabelPositions();
    }
    
    updateNodeLabelPositions() {
        this.nodes.forEach(node => {
            if (node.labelElement) {
                node.labelElement.style.left = `${node.x}px`;
                node.labelElement.style.top = `${node.y}px`;
                node.labelElement.style.transform = 'translate(-50%, -50%)';
            }
        });
    }
    
    onNodeClick(node) {
        this.activeNode = node;
        
        // Update active state on labels
        document.querySelectorAll('.neural-node-label').forEach(label => {
            label.classList.remove('active');
        });
        node.labelElement.classList.add('active');
        
        // Show content overlay with bubble
        this.showContent(node);
    }
    
    propagateSignal(sourceNode) {
        // Don't propagate for last layer nodes (they connect to same level)
        if (sourceNode.layer === 4) {
            return;
        }
        
        // Activate connections from this node
        this.connections.forEach(conn => {
            if (conn.from === sourceNode) {
                conn.active = true;
                conn.strength = 1;
                
                // Create particles along the connection
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        this.particles.push({
                            x: conn.from.x,
                            y: conn.from.y,
                            targetX: conn.to.x,
                            targetY: conn.to.y,
                            progress: 0,
                            speed: 0.02 + Math.random() * 0.01,
                            size: 3 + Math.random() * 3
                        });
                    }, i * 100);
                }
            }
        });
        
        // Fade out connections after a while
        setTimeout(() => {
            this.connections.forEach(conn => {
                if (conn.from === sourceNode) {
                    conn.active = false;
                }
            });
        }, 2000);
    }
    
    showContent(node) {
        const content = this.getNodeContent(node);
        this.bubbleContent.innerHTML = content;
        this.contentOverlay.classList.add('active');
        
        // Scroll to top of bubble content
        setTimeout(() => {
            const bubbleContent = document.querySelector('.neural-bubble-content');
            if (bubbleContent) {
                bubbleContent.scrollTop = 0;
            }
        }, 50);
    }
    
    hideContent() {
        this.contentOverlay.classList.remove('active');
        if (this.activeNode && this.activeNode.labelElement) {
            this.activeNode.labelElement.classList.remove('active');
        }
        this.activeNode = null;
    }
    
    getNodeContent(node) {
        // Get current language from window or default to English
        const currentLang = window.currentLanguage || 'en';
        const translations = window.translations || {};
        
        console.log('Getting content for node:', node.id, 'Language:', currentLang);
        console.log('Translations available:', translations);
        
        // Get node content from translations
        if (translations[currentLang] && 
            translations[currentLang].skills && 
            translations[currentLang].skills.neuralNodes && 
            translations[currentLang].skills.neuralNodes[node.id]) {
            console.log('Found content in current language:', currentLang);
            return translations[currentLang].skills.neuralNodes[node.id];
        }
        
        // Fallback to English if current language not available
        if (translations['en'] && 
            translations['en'].skills && 
            translations['en'].skills.neuralNodes && 
            translations['en'].skills.neuralNodes[node.id]) {
            console.log('Found content in English fallback');
            return translations['en'].skills.neuralNodes[node.id];
        }
        
        // Ultimate fallback
        console.warn('No content found for node:', node.id, 'in any language');
        return '<h2>Content</h2><p>Information coming soon...</p>';
    }
    
    drawConnections() {
        this.connections.forEach(conn => {
            const opacity = conn.active ? conn.strength : conn.baseStrength;
            const width = conn.active ? 2 : 1;
            
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);
            this.ctx.lineTo(conn.to.x, conn.to.y);
            this.ctx.strokeStyle = `rgba(74, 144, 226, ${opacity})`;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            
            // Decay strength
            if (conn.active && conn.strength > 0) {
                conn.strength *= 0.95;
            }
        });
    }
    
    drawParticles() {
        this.particles = this.particles.filter(particle => {
            particle.progress += particle.speed;
            
            if (particle.progress >= 1) return false;
            
            // Interpolate position
            particle.x = particle.x + (particle.targetX - particle.x) * particle.speed * 2;
            particle.y = particle.y + (particle.targetY - particle.y) * particle.speed * 2;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(99, 179, 237, ${1 - particle.progress})`;
            this.ctx.fill();
            
            // Glow effect
            const gradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 3
            );
            gradient.addColorStop(0, `rgba(99, 179, 237, ${0.3 * (1 - particle.progress)})`);
            gradient.addColorStop(1, 'rgba(99, 179, 237, 0)');
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            return true;
        });
    }
    
    drawNodes() {
        this.nodes.forEach(node => {
            // Pulsing glow effect (reduced scale to prevent overflow on resize)
            node.pulsePhase += 0.03;
            const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.1;  // Reduced from 0.15 to 0.1
            
            // Outer glow
            const gradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, node.radius * pulseScale
            );
            gradient.addColorStop(0, 'rgba(74, 144, 226, 0.3)');
            gradient.addColorStop(1, 'rgba(74, 144, 226, 0)');
            
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * pulseScale, 0, Math.PI * 2);
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            
            // Inner circle
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(74, 144, 226, 0.1)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        this.drawConnections();
        this.drawNodes();
        this.drawParticles();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    setupEventListeners() {
        // Close button
        document.getElementById('neuralCloseBtn').addEventListener('click', () => {
            this.hideContent();
        });
        
        // Click on overlay to close
        this.contentOverlay.addEventListener('click', (e) => {
            if (e.target === this.contentOverlay) {
                this.hideContent();
            }
        });
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
        
        // Close panel on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideContent();
            }
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const network = new NeuralNetwork();
});
