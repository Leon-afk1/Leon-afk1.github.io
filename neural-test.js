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
        this.canvas.height = container.clientHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    createNodes() {
        // Define technical skills as neural network nodes (based on real projects)
        const nodeData = [
            { id: 'pytorch', title: 'PyTorch', abbr: 'PT', layer: 1, color: '#ee4c2c' },
            { id: 'tf', title: 'TensorFlow/Keras', abbr: 'TF', layer: 1, color: '#ff6f00' },
            { id: 'sklearn', title: 'Scikit-learn', abbr: 'SK', layer: 1, color: '#f89939' },
            { id: 'nlp', title: 'NLP & LLM', abbr: 'NLP', layer: 2, color: '#5a9fd4' },
            { id: 'cv', title: 'Computer Vision', abbr: 'CV', layer: 2, color: '#4a8fd2' },
            { id: 'timeseries', title: 'Time Series', abbr: 'TS', layer: 2, color: '#63b3ed' },
            { id: 'fastapi', title: 'FastAPI', abbr: 'API', layer: 3, color: '#009688' },
            { id: 'streamlit', title: 'Streamlit', abbr: 'ST', layer: 3, color: '#ff4b4b' },
            { id: 'neo4j', title: 'Neo4j', abbr: 'N4J', layer: 3, color: '#008cc1' },
            { id: 'docker', title: 'Docker', abbr: 'DK', layer: 4, color: '#2496ed' }
        ];
        
        // Calculate positions based on layers
        const layers = {};
        nodeData.forEach(node => {
            if (!layers[node.layer]) layers[node.layer] = [];
            layers[node.layer].push(node);
        });
        
        const marginX = 150;
        const marginY = 200;  // Increased vertical margin
        const maxLayers = Math.max(...Object.keys(layers).map(Number));
        const layerWidth = (this.width - 2 * marginX) / maxLayers;
        
        Object.entries(layers).forEach(([layer, nodesInLayer]) => {
            const layerHeight = this.height - 2 * marginY;
            const nodeSpacing = layerHeight / (nodesInLayer.length - 1 || 1);  // Better spacing calculation
            
            nodesInLayer.forEach((node, index) => {
                this.nodes.push({
                    ...node,
                    x: marginX + layerWidth * (parseInt(layer) - 0.5),
                    y: nodesInLayer.length === 1 ? this.height / 2 : marginY + nodeSpacing * index,
                    radius: 40,
                    pulsePhase: Math.random() * Math.PI * 2,
                    connections: [],
                    expanded: false
                });
            });
        });
    }
    
    createConnections() {
        // Create logical connections between related skills (based on real projects)
        const connections = [
            // PyTorch used in CV, Time Series, NLP projects
            ['pytorch', 'cv'],
            ['pytorch', 'timeseries'],
            ['pytorch', 'nlp'],
            
            // TensorFlow/Keras used in Time Series
            ['tf', 'timeseries'],
            
            // Scikit-learn used in various ML tasks
            ['sklearn', 'timeseries'],
            
            // CV and NLP connect to FastAPI (deployment)
            ['cv', 'fastapi'],
            ['nlp', 'fastapi'],
            
            // Streamlit used in multiple projects
            ['cv', 'streamlit'],
            ['timeseries', 'streamlit'],
            ['nlp', 'streamlit'],
            
            // Neo4j used with NLP for RAG
            ['nlp', 'neo4j'],
            
            // FastAPI connects to Neo4j
            ['fastapi', 'neo4j'],
            
            // Docker for deployment
            ['fastapi', 'docker'],
            ['streamlit', 'docker']
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
        
        // Trigger neural propagation animation
        this.propagateSignal(node);
        
        // Show content panel
        this.showContent(node);
    }
    
    propagateSignal(sourceNode) {
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
                    <li><strong>YOLOv8 Object Detection:</strong> Détection d'objets en temps réel avec OpenCV</li>
                    <li><strong>MNIST Classifier:</strong> CNN pour reconnaissance de chiffres (PyTorch + ONNX)</li>
                    <li><strong>Biomedical Images:</strong> CNN pour classification d'images médicales (stage Ksilink)</li>
                    <li><strong>Interactive Demo:</strong> Intégration dans interface web avec canvas</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>YOLOv8 pour détection d'objets temps réel</li>
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
                    <li><strong>Time Series Classification:</strong> LSTM et CNN pour classification multiclass</li>
                    <li><strong>Human Activity Recognition:</strong> Contrastive learning sur données IMU/PPG de capteurs wearables</li>
                    <li><strong>Sensor Data Analysis:</strong> Traitement de données haute fréquence de capteurs</li>
                </ul>
                
                <h3>Compétences techniques</h3>
                <ul>
                    <li>LSTM et GRU pour modélisation temporelle</li>
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
                    <li><strong>Graph RAG Chatbot:</strong> API backend pour chatbot avec Neo4j</li>
                    <li><strong>Hackathon Project:</strong> Backend API avec intégration Gemini et SQL</li>
                    <li><strong>Portfolio Backend:</strong> API pour servir le chatbot du portfolio</li>
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
                    <li><strong>Time Series Dashboard:</strong> Interface interactive pour visualisation et prédictions</li>
                    <li><strong>YOLOv8 Demo:</strong> Application temps réel pour détection d'objets</li>
                    <li><strong>Hackathon Dashboard:</strong> Interface complète avec dataframes interactifs et visualisations</li>
                    <li><strong>RAG Chatbot UQAC:</strong> Interface conversationnelle avec memory management</li>
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
                <p>Base de données orientée graphe pour systèmes RAG et knowledge graphs.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Graph RAG Chatbot:</strong> Knowledge graph du handbook UQAC avec connexion LLM</li>
                    <li><strong>Semantic Relationships:</strong> Modélisation de relations complexes entre documents</li>
                    <li><strong>Backend Integration:</strong> Requêtes Cypher depuis FastAPI</li>
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
            docker: `
                <h2>Docker</h2>
                <p>Containerisation pour déploiement reproductible d'applications ML.</p>
                
                <h3>Utilisation dans mes projets</h3>
                <ul>
                    <li><strong>Hackathon Solution:</strong> Containerisation complète de l'application (frontend + backend)</li>
                    <li><strong>Backend Deployment:</strong> Dockerfiles pour APIs FastAPI</li>
                    <li><strong>ML Model Serving:</strong> Containers pour déploiement de modèles</li>
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
                <p>Expertise en développement de modèles prédictifs et systèmes d'apprentissage automatique.</p>
                
                <h3 style="margin-top: 2rem; color: #4a90e2; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>Scikit-learn</strong> - Classification, régression, clustering (⭐⭐⭐⭐⭐)</li>
                    <li><strong>XGBoost / LightGBM</strong> - Gradient boosting avancé (⭐⭐⭐⭐)</li>
                    <li><strong>Feature Engineering</strong> - Sélection et transformation (⭐⭐⭐⭐⭐)</li>
                    <li><strong>Model Optimization</strong> - Hyperparameter tuning, cross-validation (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a90e2; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>Système de prédiction de séries temporelles</li>
                    <li>Modèle de classification multi-classe</li>
                    <li>Pipeline ML automatisé avec MLflow</li>
                </ul>
            `,
            dl: `
                <h2>🧠 Deep Learning</h2>
                <p>Architectures neuronales avancées pour résoudre des problèmes complexes en vision et langage.</p>
                
                <h3 style="margin-top: 2rem; color: #63b3ed; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>PyTorch</strong> - Framework principal pour recherche et production (⭐⭐⭐⭐⭐)</li>
                    <li><strong>TensorFlow / Keras</strong> - Déploiement et prototypage rapide (⭐⭐⭐⭐)</li>
                    <li><strong>ONNX</strong> - Conversion et optimisation de modèles (⭐⭐⭐⭐)</li>
                    <li><strong>Transformers</strong> - Architectures attention-based (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #63b3ed; font-size: 1.2rem;">Architectures maîtrisées</h3>
                <ul>
                    <li>CNN (Convolutional Neural Networks) - ResNet, EfficientNet</li>
                    <li>RNN / LSTM / GRU - Séquences temporelles</li>
                    <li>Transformers - BERT, GPT, Vision Transformers</li>
                    <li>GANs - Génération d'images et de données</li>
                </ul>
            `,
            nlp: `
                <h2>💬 Natural Language Processing</h2>
                <p>Traitement et analyse du langage naturel avec des modèles de pointe.</p>
                
                <h3 style="margin-top: 2rem; color: #5a9fd4; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>Hugging Face Transformers</strong> - BERT, GPT, T5, etc. (⭐⭐⭐⭐⭐)</li>
                    <li><strong>spaCy</strong> - Pipeline NLP industrial-grade (⭐⭐⭐⭐)</li>
                    <li><strong>LangChain</strong> - Applications LLM et RAG (⭐⭐⭐⭐)</li>
                    <li><strong>Sentence Transformers</strong> - Embeddings sémantiques (⭐⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #5a9fd4; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Sentiment Analysis & Text Classification</li>
                    <li>Named Entity Recognition (NER)</li>
                    <li>Question Answering & RAG Systems</li>
                    <li>Text Generation & Summarization</li>
                    <li>Semantic Search & Embeddings</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #5a9fd4; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>Chatbot RAG avec Neo4j Graph Database</li>
                    <li>Système de Q&A pour documentation UQAC</li>
                </ul>
            `,
            cv: `
                <h2>👁️ Computer Vision</h2>
                <p>Analyse et interprétation d'images et vidéos avec deep learning.</p>
                
                <h3 style="margin-top: 2rem; color: #4a8fd2; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>OpenCV</strong> - Traitement d'images classique (⭐⭐⭐⭐⭐)</li>
                    <li><strong>YOLOv8 / YOLOv9</strong> - Détection d'objets temps réel (⭐⭐⭐⭐)</li>
                    <li><strong>Detectron2</strong> - Instance segmentation (⭐⭐⭐)</li>
                    <li><strong>Albumentations</strong> - Data augmentation avancée (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a8fd2; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Object Detection & Tracking</li>
                    <li>Image Classification & Segmentation</li>
                    <li>Pose Estimation</li>
                    <li>Image Generation & Style Transfer</li>
                    <li>Video Analysis & Processing</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a8fd2; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>MNIST Digit Classifier (PyTorch + ONNX)</li>
                    <li>Détection d'objets en temps réel avec YOLOv8</li>
                </ul>
            `,
            data: `
                <h2>📊 Data Science</h2>
                <p>Analyse, visualisation et extraction d'insights à partir de données complexes.</p>
                
                <h3 style="margin-top: 2rem; color: #4a90e2; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>Pandas</strong> - Manipulation de données (⭐⭐⭐⭐⭐)</li>
                    <li><strong>NumPy</strong> - Calcul numérique haute performance (⭐⭐⭐⭐⭐)</li>
                    <li><strong>Matplotlib / Seaborn</strong> - Visualisation statique (⭐⭐⭐⭐)</li>
                    <li><strong>Plotly</strong> - Visualisation interactive (⭐⭐⭐⭐)</li>
                    <li><strong>Jupyter / JupyterLab</strong> - Notebooks interactifs (⭐⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a90e2; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Exploratory Data Analysis (EDA)</li>
                    <li>Statistical Analysis & Hypothesis Testing</li>
                    <li>Time Series Analysis</li>
                    <li>A/B Testing & Experimentation</li>
                    <li>Data Cleaning & Preprocessing</li>
                </ul>
            `,
            backend: `
                <h2>⚙️ Backend & API Development</h2>
                <p>Développement d'APIs robustes et scalables pour applications ML.</p>
                
                <h3 style="margin-top: 2rem; color: #3a7fc2; font-size: 1.2rem;">Technologies & Frameworks</h3>
                <ul>
                    <li><strong>FastAPI</strong> - API moderne et performante (⭐⭐⭐⭐⭐)</li>
                    <li><strong>Flask</strong> - Microframework Python (⭐⭐⭐⭐)</li>
                    <li><strong>Django</strong> - Framework full-stack (⭐⭐⭐)</li>
                    <li><strong>REST API Design</strong> - Architecture et best practices (⭐⭐⭐⭐)</li>
                    <li><strong>Async Programming</strong> - asyncio, aiohttp (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #3a7fc2; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Model Serving & Inference API</li>
                    <li>Authentication & Authorization (JWT, OAuth)</li>
                    <li>Rate Limiting & Caching</li>
                    <li>Background Tasks & Job Queues</li>
                    <li>API Documentation (OpenAPI/Swagger)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #3a7fc2; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>API FastAPI pour Chatbot RAG</li>
                    <li>Backend de portfolio avec Neo4j</li>
                </ul>
            `,
            database: `
                <h2>🗄️ Databases</h2>
                <p>Gestion et optimisation de bases de données relationnelles et NoSQL.</p>
                
                <h3 style="margin-top: 2rem; color: #3a8fd2; font-size: 1.2rem;">Technologies</h3>
                <ul>
                    <li><strong>Neo4j</strong> - Graph Database pour RAG systems (⭐⭐⭐⭐⭐)</li>
                    <li><strong>PostgreSQL</strong> - Base relationnelle robuste (⭐⭐⭐⭐)</li>
                    <li><strong>MongoDB</strong> - Base documentaire NoSQL (⭐⭐⭐)</li>
                    <li><strong>Redis</strong> - Cache et message broker (⭐⭐⭐⭐)</li>
                    <li><strong>Vector Databases</strong> - Chroma, Pinecone (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #3a8fd2; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Graph Queries (Cypher pour Neo4j)</li>
                    <li>SQL avancé & Query Optimization</li>
                    <li>Database Design & Modeling</li>
                    <li>Vector Search & Semantic Similarity</li>
                    <li>Database Migrations & Versioning</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #3a8fd2; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>Graph RAG avec Neo4j pour chatbot UQAC</li>
                    <li>Système de recherche sémantique avec embeddings</li>
                </ul>
            `,
            devops: `
                <h2>🚀 DevOps & MLOps</h2>
                <p>Automatisation, déploiement et monitoring de solutions ML en production.</p>
                
                <h3 style="margin-top: 2rem; color: #4a85c2; font-size: 1.2rem;">Technologies & Tools</h3>
                <ul>
                    <li><strong>Docker</strong> - Containerisation d'applications (⭐⭐⭐⭐⭐)</li>
                    <li><strong>Git / GitHub</strong> - Version control et collaboration (⭐⭐⭐⭐⭐)</li>
                    <li><strong>CI/CD</strong> - GitHub Actions, GitLab CI (⭐⭐⭐⭐)</li>
                    <li><strong>Hugging Face Spaces</strong> - Déploiement de modèles ML (⭐⭐⭐⭐)</li>
                    <li><strong>Linux / Bash</strong> - Administration système (⭐⭐⭐⭐)</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a85c2; font-size: 1.2rem;">Compétences spécifiques</h3>
                <ul>
                    <li>Model Deployment & Serving</li>
                    <li>Monitoring & Logging</li>
                    <li>Infrastructure as Code</li>
                    <li>Automated Testing</li>
                    <li>Environment Management</li>
                </ul>
                
                <h3 style="margin-top: 1.5rem; color: #4a85c2; font-size: 1.2rem;">Projets associés</h3>
                <ul>
                    <li>Déploiement du chatbot sur Hugging Face Spaces</li>
                    <li>Containerisation avec Docker des applications ML</li>
                    <li>Portfolio GitHub Pages avec CI/CD</li>
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
            // Pulsing glow effect
            node.pulsePhase += 0.03;
            const pulseScale = 1 + Math.sin(node.pulsePhase) * 0.15;
            
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
        
        // Resize handler
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.createNodes();
            this.createConnections();
            this.updateNodeLabelPositions();
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
