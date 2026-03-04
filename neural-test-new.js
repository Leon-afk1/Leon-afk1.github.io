// Neural Network Portfolio - Interactive Visualization
class NeuralNetwork {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodesOverlay = document.getElementById('nodesOverlay');
        this.contentOverlay = document.getElementById('contentOverlay');
        this.bubbleContent = document.getElementById('bubbleContent');
        
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
            label.className = 'node-label';
            label.dataset.nodeId = node.id;
            label.innerHTML = `
                <div class="node-label-inner" style="border-color: ${node.color}">
                    <div class="node-abbr" style="color: ${node.color}">${node.abbr}</div>
                    <div class="node-title">${node.title}</div>
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
        document.querySelectorAll('.node-label').forEach(label => {
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
            const bubbleContent = document.querySelector('.bubble-content');
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
        const contents = {
            python: `
                <h2>Python</h2>
                <p>Langage de programmation principal pour tous mes projets d'IA et de data science.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Tous mes projets ML/DL:</strong> PyTorch, TensorFlow, Scikit-learn</li>
                    <li><strong>Data Processing:</strong> Pandas, NumPy pour manipulation de données</li>
                    <li><strong>APIs et Web Apps:</strong> FastAPI, Streamlit pour déploiement</li>
                    <li><strong>Scripts et Automatisation:</strong> Web scraping, processing pipelines</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Programmation orientée objet et design patterns</li>
                    <li>Gestion des environnements virtuels (venv, conda)</li>
                    <li>Debugging et profiling de code</li>
                    <li>Packages: NumPy, Pandas, Matplotlib</li>
                </ul>
            `,
            pytorch: `
                <h2>PyTorch</h2>
                <p>Framework principal pour le développement et l'entraînement de modèles deep learning.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>MNIST Classifier:</strong> CNN pour reconnaissance de chiffres manuscrits, déployé en ONNX</li>
                    <li><strong>Time Series Classification:</strong> LSTM et CNN pour classification de séries temporelles</li>
                    <li><strong>Computer Vision Projects:</strong> Architectures CNN personnalisées</li>
                    <li><strong>Contrastive Learning:</strong> Recherche sur la reconnaissance d'activités humaines (LIARA)</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Design et entraînement de CNN, LSTM, et architectures custom</li>
                    <li>Optimisation et fine-tuning de modèles</li>
                    <li>Export vers ONNX pour déploiement</li>
                    <li>Self-supervised learning et contrastive learning</li>
                    <li>Gestion des données IMU/PPG pour wearables</li>
                </ul>
            `,
            tf: `
                <h2>TensorFlow / Keras</h2>
                <p>Utilisé pour le prototypage rapide et le développement de réseaux de neurones.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Music Genre Classification:</strong> Réseau neuronal profond pour classification audio avec Keras</li>
                    <li><strong>Time Series Projects:</strong> Modèles LSTM pour prédiction temporelle</li>
                    <li><strong>Expérimentation:</strong> Tests rapides de différentes architectures</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Développement avec l'API Sequential et Functional de Keras</li>
                    <li>Traitement de données audio et temporelles</li>
                    <li>Hyperparameter tuning et validation croisée</li>
                    <li>Intégration avec Weights & Biases pour tracking</li>
                </ul>
            `,
            sklearn: `
                <h2>Scikit-learn</h2>
                <p>Bibliothèque machine learning pour preprocessing, modèles classiques et évaluation.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Music Genre Classification:</strong> SVM optimisé avec GridSearchCV (~90% accuracy)</li>
                    <li><strong>Time Series Projects:</strong> Preprocessing et feature engineering</li>
                    <li><strong>Projets ML:</strong> Classification, régression, clustering</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Support Vector Machines (SVM) et optimisation hyperparamètres</li>
                    <li>Preprocessing: StandardScaler, MinMaxScaler, encoders</li>
                    <li>Pipeline ML et cross-validation</li>
                    <li>Feature selection et dimensionality reduction</li>
                    <li>Métriques d'évaluation et courbes ROC/PR</li>
                </ul>
            `,
            hf: `
                <h2>Hugging Face</h2>
                <p>Plateforme d'hébergement pour le backend du chatbot du portfolio.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Portfolio Chatbot Backend:</strong> Hébergement du backend FastAPI avec Neo4j sur Hugging Face Spaces</li>
                    <li><strong>Modèles LLM:</strong> Utilisation de Google AI Studio et Ollama pour les modèles génératifs (pas les modèles HF)</li>
                    <li><strong>Déploiement:</strong> Spaces pour hosting d'applications ML gratuitement</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Déploiement d'applications sur Hugging Face Spaces</li>
                    <li>Configuration de backends FastAPI sur la plateforme</li>
                    <li>Gestion des secrets et variables d'environnement</li>
                    <li>Intégration avec Neo4j et bases de données externes</li>
                </ul>
            `,
            nlp: `
                <h2>NLP & LLM</h2>
                <p>Traitement du langage naturel et systèmes basés sur les Large Language Models.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Chatbot RAG UQAC:</strong> Système de Q&A avec routing LLM et recherche sémantique</li>
                    <li><strong>Hackathon 2nd Place:</strong> RAG chatbot avec Google Gemini pour génération SQL</li>
                    <li><strong>Graph RAG:</strong> Chatbot avec Neo4j et gestion de mémoire conversationnelle</li>
                    <li><strong>Web Scraping:</strong> Extraction et structuration de données textuelles</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Retrieval-Augmented Generation (RAG)</li>
                    <li>LLM Routing et semantic search</li>
                    <li>Intégration Google Gemini et Hugging Face</li>
                    <li>Conversational memory management</li>
                    <li>Source verification et traceability</li>
                    <li>Text embeddings et similarity search</li>
                </ul>
            `,
            cv: `
                <h2>Computer Vision</h2>
                <p>Détection, classification et analyse d'images avec deep learning.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>MNIST Classifier:</strong> CNN pour reconnaissance de chiffres (PyTorch + ONNX)</li>
                    <li><strong>Biomedical Images:</strong> CNN pour classification d'images médicales (stage Ksilink)</li>
                    <li><strong>Interactive Demo:</strong> Intégration dans interface web avec canvas</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>OpenCV pour preprocessing et traitement vidéo</li>
                    <li>CNN personnalisés avec PyTorch</li>
                    <li>Intégration ONNX pour déploiement web</li>
                    <li>Classification d'images biomédicales</li>
                </ul>
            `,
            timeseries: `
                <h2>Time Series</h2>
                <p>Analyse et prédiction de séries temporelles avec deep learning.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Projet LIARA:</strong> Human Activity Recognition avec contrastive learning sur données IMU/PPG de capteurs wearables</li>
                    <li><strong>Projet LIARA:</strong> LSTM et CNN pour classification de séries temporelles multiclass</li>
                    <li><strong>Projet LIARA:</strong> Traitement de données haute fréquence de capteurs avec gestion de variabilité inter-sujets</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>LSTM pour modélisation temporelle</li>
                    <li>CNN 1D pour features extraction sur séries temporelles</li>
                    <li>Contrastive learning pour données IMU/PPG</li>
                    <li>Preprocessing de données de capteurs wearables</li>
                    <li>Gestion de variabilité inter-sujets</li>
                </ul>
            `,
            fastapi: `
                <h2>FastAPI</h2>
                <p>Framework moderne pour créer des APIs performantes en Python.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Portfolio Chatbot Backend:</strong> API backend avec Neo4j pour le Graph RAG chatbot</li>
                    <li><strong>Hackathon Project:</strong> Backend API avec intégration Gemini et SQL (réalisé par un membre de l'équipe)</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>REST API design et implémentation</li>
                    <li>Async/await pour requêtes non-bloquantes</li>
                    <li>Intégration avec Neo4j et databases</li>
                    <li>CORS et gestion des requêtes cross-origin</li>
                    <li>Documentation automatique avec OpenAPI</li>
                    <li>Déploiement sur Hugging Face Spaces</li>
                </ul>
            `,
            streamlit: `
                <h2>Streamlit</h2>
                <p>Framework pour créer rapidement des interfaces web interactives pour applications ML.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>RAG Chatbot UQAC:</strong> Interface conversationnelle avec memory management</li>
                    <li><strong>Hackathon Dashboard:</strong> Interface complète avec dataframes interactifs et visualisations</li>
                    <li><strong>Chatbot pour Biologiste:</strong> Application de Q&A spécialisée</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Création d'interfaces interactives pour modèles ML</li>
                    <li>Visualisation de données avec Plotly/Matplotlib</li>
                    <li>Gestion d'état et session state</li>
                    <li>Intégration avec backends FastAPI</li>
                    <li>Upload et processing de fichiers</li>
                </ul>
            `,
            neo4j: `
                <h2>Neo4j</h2>
                <p>Base de données orientée graphe pour systèmes RAG et knowledge graphs. <span class="certification-badge">Neo4j Certified Professional</span></p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Portfolio Chatbot:</strong> Graph RAG chatbot avec knowledge graph et connexion LLM</li>
                    <li><strong>Chatbot pour Biologiste:</strong> Structuration des connaissances en graphe pour Q&A spécialisé</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Langage Cypher pour requêtes sur graphes</li>
                    <li>Design de knowledge graphs pour RAG systems</li>
                    <li>Intégration avec LLM pour question-answering</li>
                    <li>Graph-based semantic search</li>
                    <li>Traceability et source verification</li>
                </ul>
            `,
            dataproc: `
                <h2>Data Processing</h2>
                <p>Manipulation et analyse de données avec Pandas, NumPy et outils associés.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Music Genre Classification:</strong> Analyse EDA avec librosa et preprocessing audio</li>
                    <li><strong>Time Series Projects:</strong> Manipulation de données temporelles avec Pandas</li>
                    <li><strong>Tous les projets ML:</strong> Preprocessing, cleaning, feature engineering</li>
                    <li><strong>Hackathon:</strong> Traitement de larges datasets et visualisations</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Pandas pour manipulation de DataFrames</li>
                    <li>NumPy pour calculs numériques</li>
                    <li>Librosa pour analyse audio</li>
                    <li>Data cleaning et preprocessing</li>
                    <li>Feature engineering et transformation</li>
                    <li>Exploratory Data Analysis (EDA)</li>
                </ul>
            `,
            git: `
                <h2>Git / GitHub</h2>
                <p>Version control et collaboration sur tous mes projets.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Tous mes projets:</strong> GitHub pour versioning et collaboration</li>
                    <li><strong>Hackathon:</strong> Collaboration en équipe de 4 développeurs</li>
                    <li><strong>Portfolio:</strong> Déploiement sur GitHub Pages</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Git workflow (branches, merge, rebase)</li>
                    <li>GitHub Actions pour CI/CD</li>
                    <li>Collaboration et code reviews</li>
                    <li>GitHub Pages pour déploiement</li>
                    <li>Repository management et documentation</li>
                </ul>
            `,
            docker: `
                <h2>Docker</h2>
                <p>Containerisation pour déploiement reproductible d'applications. Encore en apprentissage.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Hackathon:</strong> Containerisation de l'application (frontend + backend)</li>
                    <li><strong>Portfolio Backend:</strong> Dockerfile pour l'API du chatbot</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>Écriture de Dockerfiles optimisés</li>
                    <li>Docker Compose pour multi-containers</li>
                    <li>Gestion des dépendances Python dans containers</li>
                    <li>Volumes et networking entre containers</li>
                    <li>Production-ready containerisation</li>
                </ul>
            `
        };
        
        return contents[node.id] || '<h2>Content</h2><p>Information coming soon...</p>';
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
        document.getElementById('closeBtn').addEventListener('click', () => {
            this.hideContent();
        });
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.hideContent();
            this.particles = [];
            this.connections.forEach(conn => {
                conn.active = false;
                conn.strength = 0;
            });
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
