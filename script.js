// Dark mode — permanent
document.body.setAttribute('data-theme', 'dark');

// Timeline accordion: one entry open at a time, headers act as buttons
document.addEventListener('DOMContentLoaded', function() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.timeline-item'));
    if (!items.length) return;

    function setOpen(item) {
        items.forEach(function(i) {
            var open = i === item;
            i.classList.toggle('is-open', open);
            var header = i.querySelector('.tl-header');
            if (header) header.setAttribute('aria-expanded', String(open));
        });
    }

    items.forEach(function(item) {
        var header = item.querySelector('.tl-header');
        if (!header) return;
        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.addEventListener('click', function() {
            setOpen(item.classList.contains('is-open') ? null : item);
        });
        header.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                header.click();
            }
        });
    });

    // Open first item by default
    setOpen(items[0]);
});

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        // Toggle mobile menu
        navToggle.addEventListener('click', function() {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.classList.toggle('nav-open');
        });

        // Close mobile menu when clicking on a link
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('nav-open');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
                document.body.classList.remove('nav-open');
            }
        });
    }
});

// Smooth Scrolling and Active Navigation
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    const sections = document.querySelectorAll('section[id]');

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 70; // Account for fixed nav
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Update active navigation link on scroll
    function updateActiveNavLink() {
        let current = '';
        const scrollPosition = window.scrollY + 100; // Offset for better accuracy

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // Update active link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
    updateActiveNavLink(); // Initial call
});

// Navigation Background on Scroll
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.nav');
    if (nav) {
        if (window.scrollY > 50) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }
});

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#48bb78';
            break;
        case 'error':
            notification.style.background = '#f56565';
            break;
        default:
            notification.style.background = '#3182ce';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Theme Toggle (Future Enhancement)
// Keyboard Navigation Support
document.addEventListener('keydown', function(e) {
    // ESC key closes mobile menu
    if (e.key === 'Escape') {
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.classList.remove('nav-open');
        }
    }
});

// Performance Optimization: Debounced Scroll Handler
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll handlers
const debouncedScrollHandler = debounce(function() {
    // Scroll-dependent functions can be called here
}, 16); // ~60fps

window.addEventListener('scroll', debouncedScrollHandler);

// Preload Critical Resources
document.addEventListener('DOMContentLoaded', function() {
    // Preload critical fonts
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap';
    fontLink.as = 'style';
    document.head.appendChild(fontLink);
    
    // Optimize images loading
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.loading = 'lazy';
    });
});

// Contact Form Functionality
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    const submitBtn = document.getElementById('submit-btn');
    const formStatus = document.getElementById('form-status');

    if (contactForm && submitBtn) {
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            if (btnText && btnLoading) {
                btnText.style.display = 'none';
                btnLoading.style.display = 'inline';
            }
            submitBtn.disabled = true;
            if (formStatus) {
                formStatus.innerHTML = '';
            }

            // Get form data
            const formData = new FormData(contactForm);
            
            try {
                // Submit to Formspree
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Show success message
                    const t = translations[currentLanguage] || translations['en'] || {};
                    const successMsg = t.contact?.form?.successMessage || '✓ Message sent successfully! I\'ll get back to you soon.';
                    if (formStatus) {
                        formStatus.innerHTML = `<div class="form-success">${successMsg}</div>`;
                    }
                    contactForm.reset();
                } else {
                    // Handle Formspree validation errors
                    const data = await response.json();
                    if (data.errors) {
                        const errorMsg = data.errors.map(error => error.message).join(', ');
                        if (formStatus) {
                            formStatus.innerHTML = `<div class="form-error">✗ ${errorMsg}</div>`;
                        }
                    } else {
                        throw new Error('Form submission failed');
                    }
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                // Show error message
                const t = translations[currentLanguage] || translations['en'] || {};
                const errorMsg = t.contact?.form?.errorMessage || '✗ Something went wrong. Please try again or email me directly.';
                if (formStatus) {
                    formStatus.innerHTML = `<div class="form-error">${errorMsg}</div>`;
                }
            } finally {
                // Reset button state
                if (btnText && btnLoading) {
                    btnText.style.display = 'inline';
                    btnLoading.style.display = 'none';
                }
                submitBtn.disabled = false;
            }
        });
    }
});

// Language System
let currentLanguage = 'en';
window.currentLanguage = 'en'; // Expose globally for chatbot
let translations = {};
window.translations = {}; // Exposed globally for the other scripts

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('./texte.json');
        translations = await response.json();
        window.translations = translations; // Update global reference
        console.log('Translations loaded successfully:', translations);
        
        // Set default language from localStorage or browser preference
        const savedLanguage = localStorage.getItem('language') || 
                             (navigator.language.startsWith('fr') ? 'fr' : 'en');
        
        console.log('Setting initial language to:', savedLanguage);
        setLanguage(savedLanguage);
    } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback: keep current content if JSON fails to load
    }
}

// Helper function to safely update element content
function safeUpdateElement(selector, content, attribute = 'textContent') {
    try {
        const element = document.querySelector(selector);
        if (element) {
            if (attribute === 'textContent') {
                element.textContent = content;
            } else {
                element.setAttribute(attribute, content);
            }
        } else {
            console.warn('Element not found:', selector);
        }
    } catch (error) {
        console.warn('Error updating element:', selector, error);
    }
}

// Update page content with current language
function updateContent() {
    if (!translations[currentLanguage]) {
        console.log('No translations available for language:', currentLanguage);
        return;
    }
    
    console.log('Updating content to language:', currentLanguage);
    const t = translations[currentLanguage];
    
    // Update debug indicator immediately
    const currentLangElement = document.getElementById('current-lang');
    if (currentLangElement) {
        currentLangElement.textContent = `${currentLanguage.toUpperCase()} (${currentLanguage === 'en' ? 'English' : 'Français'})`;
    }
    
    // Update page title and meta
    document.title = t.pageTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = t.metaDescription;
    
    // Navigation
    safeUpdateElement('.nav-logo', t.nav.logo);
    safeUpdateElement('.nav-link[href="#about"]', t.nav.about);
    safeUpdateElement('a[href="#skills"]', t.nav.skills);
    safeUpdateElement('a[href="#projects"]', t.nav.projects);
    safeUpdateElement('a[href="#experience"]', t.nav.experience);
    safeUpdateElement('a[href="#contact"]', t.nav.contact);
    safeUpdateElement('#theme-toggle', t.nav.themeToggleLabel, 'aria-label');
    
    // Hero section - using direct updates for testing
    const heroGreeting = document.querySelector('.hero-greeting');
    const heroName = document.querySelector('.hero-name');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroDescription = document.querySelector('.hero-description');
    const btnPrimary = document.querySelector('.hero-buttons a[href="#projects"]');
    const btnSecondary = document.querySelector('.hero-buttons a[href="#contact"]');
    
    if (heroGreeting) {
        heroGreeting.textContent = t.hero.greeting;
        console.log('Updated hero greeting to:', t.hero.greeting);
    }
    if (heroName) {
        heroName.textContent = t.hero.name;
        console.log('Updated hero name to:', t.hero.name);
    }
    if (heroSubtitle) {
        heroSubtitle.textContent = t.hero.subtitle;
        console.log('Updated hero subtitle to:', t.hero.subtitle);
    }
    if (heroDescription) {
        heroDescription.textContent = t.hero.description;
        console.log('Updated hero description');
    }
    if (btnPrimary) {
        btnPrimary.textContent = t.hero.buttonProjects;
        console.log('Updated primary button to:', t.hero.buttonProjects);
    }
    if (btnSecondary) {
        btnSecondary.textContent = t.hero.buttonContact;
        console.log('Updated secondary button to:', t.hero.buttonContact);
    }
    
    // About section
    safeUpdateElement('#about .section-title', t.about.title);
    const aboutTexts = document.querySelectorAll('.about-text p');
    if (aboutTexts[0]) aboutTexts[0].textContent = t.about.paragraph1;
    if (aboutTexts[1]) aboutTexts[1].textContent = t.about.paragraph2;
    
    // Stats
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = t.about.stat1Label;
    if (statLabels[1]) statLabels[1].textContent = t.about.stat2Label;
    if (statLabels[2]) statLabels[2].textContent = t.about.stat3Label;
    
    // Skills section
    safeUpdateElement('#skills .section-title', t.skills.title);
    // Certifications section
    safeUpdateElement('.subsection-title', t.skills.certificationsTitle);
    // Projects section
    document.querySelector('#projects .section-title').textContent = t.projects.title;
    // MNIST Demo section
    document.querySelector('#mnist-demo .section-title').textContent = t.mnistDemo.title;
    document.querySelector('.mnist-description').textContent = t.mnistDemo.description;
    document.querySelector('.drawing-section h3').textContent = t.mnistDemo.drawingTitle;
    document.querySelector('#clearCanvas').textContent = t.mnistDemo.clearButton;
    document.querySelector('#predictDigit').textContent = t.mnistDemo.predictButton;
    document.querySelector('.preview-section h3').textContent = t.mnistDemo.previewTitle;
    const previewInfo = document.querySelectorAll('.preview-info p');
    previewInfo[0].textContent = t.mnistDemo.previewLine1;
    previewInfo[1].textContent = t.mnistDemo.previewLine2;
    previewInfo[2].textContent = t.mnistDemo.previewLine3;
    document.querySelector('.prediction-section h3').textContent = t.mnistDemo.predictionTitle;
    const predictionPlaceholder = document.querySelector('#predictionTable .prediction-placeholder');
    if (predictionPlaceholder) predictionPlaceholder.textContent = t.mnistDemo.predictionPlaceholder;
    
    // Experience section
    document.querySelector('#experience .section-title').textContent = t.experience.title;
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Experience 0 (Astek R&D Internship)
    timelineItems[0].querySelector('h3').textContent = t.experience.item0.title;
    timelineItems[0].querySelector('.company').textContent = t.experience.item0.company;
    timelineItems[0].querySelector('.period').textContent = t.experience.item0.period;
    const exp0Achievements = timelineItems[0].querySelectorAll('.achievements li');
    exp0Achievements[0].textContent = t.experience.item0.achievement1;
    exp0Achievements[1].textContent = t.experience.item0.achievement2;
    if (exp0Achievements[2] && t.experience.item0.achievement3) exp0Achievements[2].textContent = t.experience.item0.achievement3;
    if (exp0Achievements[3] && t.experience.item0.achievement4) exp0Achievements[3].textContent = t.experience.item0.achievement4;
    
    // Experience 1 (Double Degree)
    timelineItems[1].querySelector('h3').textContent = t.experience.item1.title;
    timelineItems[1].querySelector('.company').textContent = t.experience.item1.company;
    timelineItems[1].querySelector('.period').textContent = t.experience.item1.period;
    const exp1Achievements = timelineItems[1].querySelectorAll('.achievements li');
    exp1Achievements[0].textContent = t.experience.item1.achievement1;
    exp1Achievements[1].textContent = t.experience.item1.achievement2;
    exp1Achievements[2].textContent = t.experience.item1.achievement3;
    
    // Experience 2 (Hackathon)
    timelineItems[2].querySelector('h3').textContent = t.experience.item2.title;
    timelineItems[2].querySelector('.company').textContent = t.experience.item2.company;
    timelineItems[2].querySelector('.period').textContent = t.experience.item2.period;
    const exp2Achievements = timelineItems[2].querySelectorAll('.achievements li');
    exp2Achievements[0].textContent = t.experience.item2.achievement1;
    exp2Achievements[1].textContent = t.experience.item2.achievement2;
    exp2Achievements[2].textContent = t.experience.item2.achievement3;
    exp2Achievements[3].textContent = t.experience.item2.achievement4;
    
    // Experience 3 (Engineering Degree)
    timelineItems[3].querySelector('h3').textContent = t.experience.item3.title;
    timelineItems[3].querySelector('.company').textContent = t.experience.item3.company;
    timelineItems[3].querySelector('.period').textContent = t.experience.item3.period;
    const exp3Achievements = timelineItems[3].querySelectorAll('.achievements li');
    exp3Achievements[0].textContent = t.experience.item3.achievement1;
    exp3Achievements[1].textContent = t.experience.item3.achievement2;
    exp3Achievements[2].textContent = t.experience.item3.achievement3;
    exp3Achievements[3].textContent = t.experience.item3.achievement4;
    
    // Experience 4 (Ksilink internship)
    timelineItems[4].querySelector('h3').textContent = t.experience.item4.title;
    timelineItems[4].querySelector('.company').textContent = t.experience.item4.company;
    timelineItems[4].querySelector('.period').textContent = t.experience.item4.period;
    const exp4Achievements = timelineItems[4].querySelectorAll('.achievements li');
    exp4Achievements[0].textContent = t.experience.item4.achievement1;
    exp4Achievements[1].textContent = t.experience.item4.achievement2;
    exp4Achievements[2].textContent = t.experience.item4.achievement3;
    // Handle internship report link
    const exp4ReportLink = timelineItems[4].querySelector('.internship-report-link');
    if (exp4ReportLink) {
        exp4ReportLink.textContent = t.experience.item4.reportText;
        exp4ReportLink.href = t.experience.item4.reportUrl;
    }
    
    // Experience 5 (Exchange)
    timelineItems[5].querySelector('h3').textContent = t.experience.item5.title;
    timelineItems[5].querySelector('.company').textContent = t.experience.item5.company;
    timelineItems[5].querySelector('.period').textContent = t.experience.item5.period;
    const exp5Achievements = timelineItems[5].querySelectorAll('.achievements li');
    exp5Achievements[0].textContent = t.experience.item5.achievement1;
    exp5Achievements[1].textContent = t.experience.item5.achievement2;
    exp5Achievements[2].textContent = t.experience.item5.achievement3;
    
    // Contact section
    document.querySelector('#contact .section-title').textContent = t.contact.title;
    document.querySelector('.contact-description').textContent = t.contact.description;
    const contactMethods = document.querySelectorAll('.contact-method span:last-child');
    contactMethods[0].textContent = t.contact.method1;
    contactMethods[1].textContent = t.contact.method2;
    contactMethods[2].textContent = t.contact.method3;
    
    // Contact form
    document.querySelector('label[for="name"]').textContent = t.contact.form.nameLabel;
    document.querySelector('label[for="email"]').textContent = t.contact.form.emailLabel;
    document.querySelector('label[for="message"]').textContent = t.contact.form.messageLabel;
    document.querySelector('.btn-text').textContent = t.contact.form.submitButton;
    document.querySelector('.btn-loading').textContent = t.contact.form.submitButtonLoading;
    
    // Chatbot
    if (t.chatbot) {
        const chatbotTitle = document.querySelector('[data-translate="chatbot.title"]');
        if (chatbotTitle) chatbotTitle.textContent = t.chatbot.title;
        
        const chatbotWelcome = document.querySelector('[data-translate="chatbot.welcome"]');
        if (chatbotWelcome) chatbotWelcome.textContent = t.chatbot.welcome;
        
        const chatbotInput = document.querySelector('[data-translate-placeholder="chatbot.placeholder"]');
        if (chatbotInput) chatbotInput.placeholder = t.chatbot.placeholder;
        
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        if (suggestionBtns[0]) suggestionBtns[0].textContent = t.chatbot.suggestion1;
        if (suggestionBtns[1]) suggestionBtns[1].textContent = t.chatbot.suggestion2;
        if (suggestionBtns[2]) suggestionBtns[2].textContent = t.chatbot.suggestion3;
        
        // Update data-question attributes based on language
        const suggestions = {
            en: [
                "What are your main skills?",
                "Tell me about your projects",
                "What is your experience?"
            ],
            fr: [
                "Quelles sont tes compétences principales ?",
                "Parle-moi de tes projets",
                "Quelle est ton expérience ?"
            ]
        };
        
        suggestionBtns.forEach((btn, index) => {
            if (suggestions[currentLanguage] && suggestions[currentLanguage][index]) {
                btn.setAttribute('data-question', suggestions[currentLanguage][index]);
            }
        });
    }
    
    // Footer
    document.querySelector('.footer p').textContent = t.footer.copyright.replace(/20\d\d/, new Date().getFullYear());
}

// Set language and update interface
function setLanguage(lang) {
    console.log('setLanguage called with:', lang);
    currentLanguage = lang;
    window.currentLanguage = lang; // Expose to window for chatbot
    localStorage.setItem('language', lang);
    
    // Update language toggle button
    const languageIcon = document.querySelector('.language-icon');
    if (languageIcon) {
        // Show the flag of the language you can switch TO
        if (lang === 'en') {
            // Show French flag (can switch to French)
            languageIcon.className = 'language-icon language-code'; languageIcon.textContent = 'FR';
        } else {
            // Show UK flag (can switch to English)
            languageIcon.className = 'language-icon language-code'; languageIcon.textContent = 'EN';
        }
        console.log('Language icon updated with flag-icons');
    } else {
        console.warn('Language icon element not found');
    }
    
    // Update page HTML lang attribute
    document.documentElement.lang = lang;
    
    // Dispatch event for chatbot to listen
    const languageChangedEvent = new CustomEvent('languageChanged', { detail: { language: lang } });
    document.dispatchEvent(languageChangedEvent);
    
    updateContent();
}

// Initialize language system
function initializeLanguageSystem() {
    console.log('Initializing language system...');
    const languageToggle = document.getElementById('language-toggle');
    
    if (languageToggle) {
        console.log('Language toggle button found, adding event listener...');
        languageToggle.addEventListener('click', function() {
            const newLanguage = currentLanguage === 'en' ? 'fr' : 'en';
            console.log('Switching language from', currentLanguage, 'to', newLanguage);
            setLanguage(newLanguage);
            
            // Add rotation animation
            languageToggle.style.transform = 'rotate(360deg)';
            setTimeout(() => {
                languageToggle.style.transform = 'rotate(0deg)';
            }, 300);
        });
    } else {
        console.warn('Language toggle button not found!');
    }
    
    // Load translations when page loads
    loadTranslations();
}

// Language Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize language system
    initializeLanguageSystem();
});

console.log('Portfolio website loaded successfully!');

// Test function for debugging (can be called from browser console)
window.testLanguageSystem = function() {
    console.log('Current language:', currentLanguage);
    console.log('Available translations:', Object.keys(translations));
    console.log('French translations loaded:', !!translations.fr);
    console.log('English translations loaded:', !!translations.en);
    
    if (translations.fr) {
        console.log('Sample French text:', translations.fr.hero.greeting);
    }
    if (translations.en) {
        console.log('Sample English text:', translations.en.hero.greeting);
    }
};

// Test function to manually switch language
window.switchToFrench = function() {
    setLanguage('fr');
};

window.switchToEnglish = function() {
    setLanguage('en');
};

// MNIST Digit Recognition Demo
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('drawingCanvas');
    const previewCanvas = document.getElementById('previewCanvas');
    const clearBtn = document.getElementById('clearCanvas');
    const predictBtn = document.getElementById('predictDigit');
    const predictionTable = document.getElementById('predictionTable');
    
    if (!canvas || !previewCanvas) return; // Exit if canvases not found
    
    const ctx = canvas.getContext('2d');
    const previewCtx = previewCanvas.getContext('2d');
    let isDrawing = false;
    let model = null;
    let previewTimeout = null;
    
    // Initialize canvases
    function initCanvas() {
        // Drawing canvas - white background for user drawing
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 22;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Preview canvas - black background to show MNIST format
        previewCtx.fillStyle = '#000000';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        updatePreview();
    }
    
    // Drawing functionality
    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }
    
    function draw(e) {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        // Throttled preview update during drawing
        if (previewTimeout) clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 100);
    }
    
    function stopDrawing() {
        if (!isDrawing) return;
        isDrawing = false;
        ctx.beginPath();
        updatePreview(); // Update preview when drawing stops
    }
    
    // Update preview canvas to show how the model sees the image
    function updatePreview() {
        console.log('Updating preview...');
        // Get the processed image data
        const processedData = preprocessCanvasAdvanced();
        
        // Clear preview canvas
        previewCtx.fillStyle = '#000000';
        previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
        
        // Draw the 28x28 processed image scaled up to 140x140 (5x scale)
        const imageData = previewCtx.createImageData(140, 140);
        const scale = 140 / 28;
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                const pixelValue = processedData[y * 28 + x];
                // Convert from normalized value back to 0-255 for display
                // Denormalize: tensorValue = (normalized * std) + mean
                const tensorValue = (pixelValue * 0.3081) + 0.1307;
                // Clamp to valid range and convert to 0-255
                const clampedValue = Math.max(0, Math.min(1, tensorValue));
                const grayValue = Math.round(clampedValue * 255);
                
                // Fill the scaled area (5x5 pixels for each original pixel)
                for (let dy = 0; dy < scale; dy++) {
                    for (let dx = 0; dx < scale; dx++) {
                        const pixelIndex = ((y * scale + dy) * 140 + (x * scale + dx)) * 4;
                        imageData.data[pixelIndex] = grayValue;     // Red
                        imageData.data[pixelIndex + 1] = grayValue; // Green
                        imageData.data[pixelIndex + 2] = grayValue; // Blue
                        imageData.data[pixelIndex + 3] = 255;       // Alpha
                    }
                }
            }
        }
        
        previewCtx.putImageData(imageData, 0, 0);
    }
    
    // Touch events for mobile
    function getTouchPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    
    function handleTouchStart(e) {
        e.preventDefault();
        console.log('Touch start detected'); // Debug log
        if (e.touches.length === 1) {
            const pos = getTouchPos(e);
            isDrawing = true;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        }
    }
    
    function handleTouchMove(e) {
        e.preventDefault();
        if (!isDrawing || e.touches.length !== 1) return;
        
        const pos = getTouchPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        
        // Throttled preview update during drawing
        if (previewTimeout) clearTimeout(previewTimeout);
        previewTimeout = setTimeout(updatePreview, 100);
    }
    
    function handleTouchEnd(e) {
        e.preventDefault();
        console.log('Touch end detected'); // Debug log
        if (isDrawing) {
            isDrawing = false;
            ctx.beginPath();
            updatePreview(); // Update preview when drawing stops
        }
    }
    
    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Clear canvas
    clearBtn.addEventListener('click', () => {
        initCanvas();
        updatePredictionTable([]);
        
        // Reset predict button text and state
        const t = translations[currentLanguage] || translations['en'] || {};
        predictBtn.textContent = t.mnistDemo?.predictButton || 'Predict';
        predictBtn.disabled = false;
    });
    
    // Load your PyTorch model using ONNX.js
    async function loadModel() {
        try {
            console.log('Loading ONNX model with ONNX Runtime Web...');
            
            // Use ONNX Runtime Web API
            const session = await ort.InferenceSession.create('./mnist_model.onnx');
            model = session;
            
            console.log('Your PyTorch MNIST model loaded successfully!');
            console.log('Model input names:', session.inputNames);
            console.log('Model output names:', session.outputNames);
            return true;
        } catch (error) {
            console.error('Error loading model:', error);
            console.log('Using demo mode - model loading failed');
            model = null; // Ensure model is null for fallback
            return false;
        }
    }
    
    // Advanced preprocessing with proper centering and padding
    function preprocessCanvasAdvanced() {
        console.log('Starting advanced preprocessing...');
        // Get image data from canvas
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Convert to grayscale and find bounding box
        const grayImage = [];
        let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;
        let hasContent = false;
        
        for (let y = 0; y < canvas.height; y++) {
            for (let x = 0; x < canvas.width; x++) {
                const idx = (y * canvas.width + x) * 4;
                // Invert colors: black pen on white background -> white digit on black background
                const gray = 255 - (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
                grayImage.push(gray);
                
                // Find bounding box of non-black pixels
                if (gray > 50) { // Threshold to detect drawn content
                    hasContent = true;
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (!hasContent) {
            console.log('No content detected, returning empty array');
            // Return empty normalized array
            return new Array(784).fill((0 - 0.1307) / 0.3081);
        }
        
        console.log('Bounding box:', {minX, maxX, minY, maxY});
        
        // Add padding around the digit
        const padding = 20;
        minX = Math.max(0, minX - padding);
        maxX = Math.min(canvas.width - 1, maxX + padding);
        minY = Math.max(0, minY - padding);
        maxY = Math.min(canvas.height - 1, maxY + padding);
        
        // Extract the digit region
        const digitWidth = maxX - minX + 1;
        const digitHeight = maxY - minY + 1;
        
        // Create a square crop (MNIST digits are roughly square)
        const cropSize = Math.max(digitWidth, digitHeight);
        const cropX = minX - (cropSize - digitWidth) / 2;
        const cropY = minY - (cropSize - digitHeight) / 2;
        
        // Create 28x28 result array
        const result = new Array(784);
        
        for (let y = 0; y < 28; y++) {
            for (let x = 0; x < 28; x++) {
                // Map 28x28 coordinates to crop coordinates
                const srcX = Math.round(cropX + (x / 27) * (cropSize - 1));
                const srcY = Math.round(cropY + (y / 27) * (cropSize - 1));
                
                let grayValue = 0;
                if (srcX >= 0 && srcX < canvas.width && srcY >= 0 && srcY < canvas.height) {
                    grayValue = grayImage[srcY * canvas.width + srcX];
                }
                
                // Apply the exact same preprocessing as your PyTorch model:
                // 1. Normalize to 0-1 range (like transforms.ToTensor())
                const tensorValue = grayValue / 255.0;
                // 2. Apply MNIST normalization: (x - mean) / std
                const normalized = (tensorValue - 0.1307) / 0.3081;
                result[y * 28 + x] = normalized;
            }
        }
        
        console.log('Preprocessing complete. Sample values:', result.slice(300, 310));
        console.log('Min/Max values:', Math.min(...result), Math.max(...result));
        
        return result;
    }
    
    // Simple preprocessing (for backward compatibility)
    function preprocessCanvas() {
        return preprocessCanvasAdvanced();
    }
    
    // Predict using your PyTorch model
    async function predictWithModel(inputData) {
        if (!model) {
            console.log('Model not loaded, using demo predictions');
            return demoPredict(); // Fallback to demo if model not loaded
        }
        
        try {
            console.log('Running actual model prediction...');
            
            // Debug: Check input data format
            console.log('Input data length:', inputData.length);
            console.log('Input data sample (first 10 values):', inputData.slice(0, 10));
            
            // Prepare input tensor for ONNX Runtime Web
            const float32Data = new Float32Array(inputData);
            const inputTensor = new ort.Tensor('float32', float32Data, [1, 1, 28, 28]);
            
            console.log('Input tensor shape:', inputTensor.dims);
            console.log('Input tensor type:', inputTensor.type);
            
            // Run inference with proper input mapping
            const feeds = {};
            feeds[model.inputNames[0]] = inputTensor;
            
            console.log('Running model inference with input name:', model.inputNames[0]);
            const outputMap = await model.run(feeds);
            console.log('Output map keys:', Object.keys(outputMap));
            
            const outputTensorName = model.outputNames[0];
            const outputTensor = outputMap[outputTensorName];
            const predictions = Array.from(outputTensor.data);
            
            console.log('Raw model outputs:', predictions);
            
            // Apply softmax to get probabilities
            const maxLogit = Math.max(...predictions);
            const expValues = predictions.map(x => Math.exp(x - maxLogit));
            const sumExp = expValues.reduce((a, b) => a + b, 0);
            const probabilities = expValues.map(x => x / sumExp);
            
            console.log('Probabilities after softmax:', probabilities);
            
            // Create prediction objects
            const results = probabilities.map((prob, digit) => ({
                digit,
                confidence: prob
            }));
            
            // Sort by confidence and return top 5
            results.sort((a, b) => b.confidence - a.confidence);
            console.log('Top 5 predictions:', results.slice(0, 5));
            
            return results.slice(0, 5);
            
        } catch (error) {
            console.error('Prediction error:', error);
            console.log('Falling back to demo predictions');
            return demoPredict(); // Fallback to demo
        }
    }
    
    // Demo prediction function (fallback when model not available)
    function demoPredict() {
        const predictions = [];
        
        // Create random but realistic predictions
        for (let i = 0; i < 10; i++) {
            predictions.push({
                digit: i,
                confidence: Math.random() * 0.9 + 0.1
            });
        }
        
        // Sort by confidence and return top 5
        predictions.sort((a, b) => b.confidence - a.confidence);
        return predictions.slice(0, 5);
    }
    
    // Update prediction table
    function updatePredictionTable(predictions) {
        if (predictions.length === 0) {
            const t = translations[currentLanguage] || translations['en'] || {};
            const placeholder = t.mnistDemo?.predictionPlaceholder || 'Draw a digit to see predictions';
            predictionTable.innerHTML = `<div class="prediction-row"><span class="digit prediction-placeholder">${placeholder}</span></div>`;
            return;
        }
        
        predictionTable.innerHTML = '';
        
        predictions.forEach((pred, index) => {
            const row = document.createElement('div');
            row.className = 'prediction-row';
            if (index === 0) row.classList.add('top-prediction');
            
            row.innerHTML = `
                <span class="digit">${pred.digit}</span>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${pred.confidence * 100}%"></div>
                </div>
                <span class="confidence">${(pred.confidence * 100).toFixed(1)}%</span>
            `;
            
            predictionTable.appendChild(row);
        });
    }
    
    // Predict digit
    predictBtn.addEventListener('click', async () => {
        const t = translations[currentLanguage] || translations['en'] || {};
        
        try {
            // Preprocess the canvas image
            const inputData = preprocessCanvas();
            
            // Check if canvas has content (adjusted threshold for normalized data)
            const hasContent = inputData.some(pixel => pixel > -0.3); // Adjusted for normalized range
            if (!hasContent) {
                alert('Please draw a digit first!');
                return;
            }
            
            // Debug: Log input statistics
            const mean = inputData.reduce((a, b) => a + b) / inputData.length;
            const min = Math.min(...inputData);
            const max = Math.max(...inputData);
            console.log(`Input stats - Mean: ${mean.toFixed(4)}, Min: ${min.toFixed(4)}, Max: ${max.toFixed(4)}`);
            
            predictBtn.textContent = t.mnistDemo?.predictingButton || 'Predicting...';
            predictBtn.disabled = true;
            
            // Use your actual PyTorch model for prediction
            const predictions = await predictWithModel(inputData);
            
            updatePredictionTable(predictions);
            
        } catch (error) {
            console.error('Prediction error:', error);
            alert('Error during prediction. Please try again.');
        } finally {
            predictBtn.textContent = t.mnistDemo?.predictButton || 'Predict';
            predictBtn.disabled = false;
        }
    });
    
    // Initialize
    initCanvas();
    // Lazy-load ONNX Runtime + model only when the demo is near the viewport
    let mnistStarted = false;
    const startMnist = async () => {
        if (mnistStarted) return;
        mnistStarted = true;
        try { await window.loadOrt(); } catch (e) { console.warn('ONNX Runtime failed to load', e); }
        loadModel();
    };
    const mnistSection = document.getElementById('mnist-demo');
    if ('IntersectionObserver' in window && mnistSection) {
        new IntersectionObserver((entries, o) => {
            if (entries.some(en => en.isIntersecting)) { o.disconnect(); startMnist(); }
        }, { rootMargin: '400px' }).observe(mnistSection);
    } else { startMnist(); }
    canvas.addEventListener('pointerdown', startMnist, { once: true });
});