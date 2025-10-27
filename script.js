// Set dark theme as default
document.addEventListener('DOMContentLoaded', function() {
    // Set dark theme by default
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    
    // Update theme icon if it exists
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = '☀️'; // Sun icon for dark theme (to switch to light)
    }
});


// Theme Toggle Functionality
document.addEventListener('DOMContentLoaded', function() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.querySelector('.theme-icon');
    
    if (!themeToggle || !themeIcon) return;
    
    // Load saved theme or default to dark
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Add rotation animation
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
    
    function updateThemeIcon(theme) {
        themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
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

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.skill-category, .project-card, .timeline-item, .stat');
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Contact Form Handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const name = formData.get('name');
            const email = formData.get('email');
            const message = formData.get('message');
            
            // Basic validation
            if (!name || !email || !message) {
                showNotification('Please fill in all fields.', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showNotification('Please enter a valid email address.', 'error');
                return;
            }
            
            // Simulate form submission
            const submitButton = this.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            submitButton.textContent = 'Sending...';
            submitButton.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                showNotification('Thank you for your message! I\'ll get back to you soon.', 'success');
                this.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 2000);
        });
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

// Typing Animation for Hero Text
let typewriterActive = false;

function startTypewriterEffect(text) {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (!heroSubtitle || typewriterActive) return;
    
    typewriterActive = true;
    heroSubtitle.textContent = '';
    heroSubtitle.style.borderRight = '2px solid rgba(255, 255, 255, 0.7)';
    
    let i = 0;
    function typeWriter() {
        if (i < text.length) {
            heroSubtitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, 100);
        } else {
            // Remove cursor after typing is complete
            setTimeout(() => {
                heroSubtitle.style.borderRight = 'none';
                typewriterActive = false;
            }, 1000);
        }
    }
    
    // Start typing after a delay
    setTimeout(typeWriter, 500);
}

// Parallax Effect for Hero Section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    
    if (hero && scrolled < hero.offsetHeight) {
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
});

// Dynamic Stats Counter
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + '+';
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + '+';
        }
    }
    
    updateCounter();
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumber = entry.target.querySelector('.stat-number');
            const targetValue = parseInt(statNumber.textContent);
            animateCounter(statNumber, targetValue);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', function() {
    const stats = document.querySelectorAll('.stat');
    stats.forEach(stat => statsObserver.observe(stat));
});

// Project Card Tilt Effect
document.addEventListener('DOMContentLoaded', function() {
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
});

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
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Show loading state
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            submitBtn.disabled = true;
            formStatus.innerHTML = '';

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
                    formStatus.innerHTML = `<div class="form-success">${successMsg}</div>`;
                    contactForm.reset();
                } else {
                    // Handle Formspree validation errors
                    const data = await response.json();
                    if (data.errors) {
                        const errorMsg = data.errors.map(error => error.message).join(', ');
                        formStatus.innerHTML = `<div class="form-error">✗ ${errorMsg}</div>`;
                    } else {
                        throw new Error('Form submission failed');
                    }
                }
                
            } catch (error) {
                console.error('Form submission error:', error);
                // Show error message
                const t = translations[currentLanguage] || translations['en'] || {};
                const errorMsg = t.contact?.form?.errorMessage || '✗ Something went wrong. Please try again or email me directly.';
                formStatus.innerHTML = `<div class="form-error">${errorMsg}</div>`;
            } finally {
                // Reset button state
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }
});

// Language System
let currentLanguage = 'en';
let translations = {};

// Load translations from JSON file
async function loadTranslations() {
    try {
        const response = await fetch('./texte.json');
        translations = await response.json();
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
    safeUpdateElement('a[href="#about"]', t.nav.about);
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
    const btnPrimary = document.querySelector('.hero-buttons .btn-primary');
    const btnSecondary = document.querySelector('.hero-buttons .btn-secondary');
    
    if (heroGreeting) {
        heroGreeting.textContent = t.hero.greeting;
        console.log('Updated hero greeting to:', t.hero.greeting);
    }
    if (heroName) {
        heroName.textContent = t.hero.name;
        heroName.setAttribute('data-text', t.hero.name.split(' ')[0]);
        console.log('Updated hero name to:', t.hero.name);
    }
    if (heroSubtitle) {
        // Use typewriter effect for hero subtitle
        startTypewriterEffect(t.hero.subtitle);
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
    document.querySelector('#skills .section-title').textContent = t.skills.title;
    const skillCategories = document.querySelectorAll('.skill-category');
    
    // Helper function to add certification badges
    function addCertificationBadge(text, badgeText) {
        return text.replace(` - ${badgeText}`, ` - <span class="certification-badge">${badgeText}</span>`);
    }
    
    // Category 1: AI & Machine Learning
    skillCategories[0].querySelector('h3').textContent = t.skills.category1Title;
    const cat1Items = skillCategories[0].querySelectorAll('li');
    
    // Handle NVIDIA certification in both languages
    if (currentLanguage === 'en') {
        cat1Items[0].innerHTML = addCertificationBadge(t.skills.category1Item1, 'NVIDIA Certified');
        cat1Items[4].innerHTML = addCertificationBadge(t.skills.category1Item5, 'Google Certified');
    } else if (currentLanguage === 'fr') {
        cat1Items[0].innerHTML = addCertificationBadge(t.skills.category1Item1, 'Certifié NVIDIA');
        cat1Items[4].innerHTML = addCertificationBadge(t.skills.category1Item5, 'Certifié Google');
    }
    
    cat1Items[1].textContent = t.skills.category1Item2;
    cat1Items[2].textContent = t.skills.category1Item3;
    cat1Items[3].textContent = t.skills.category1Item4;
    cat1Items[5].textContent = t.skills.category1Item6;
    
    // Category 2: Data Technologies & Databases
    skillCategories[1].querySelector('h3').textContent = t.skills.category2Title;
    const cat2Items = skillCategories[1].querySelectorAll('li');
    
    // Handle Neo4j certification in both languages
    if (currentLanguage === 'en') {
        cat2Items[0].innerHTML = addCertificationBadge(t.skills.category2Item1, 'Neo4j Certified Professional');
    } else if (currentLanguage === 'fr') {
        cat2Items[0].innerHTML = addCertificationBadge(t.skills.category2Item1, 'Professionnel Certifié Neo4j');
    }
    
    cat2Items[1].textContent = t.skills.category2Item2;
    cat2Items[2].textContent = t.skills.category2Item3;
    cat2Items[3].textContent = t.skills.category2Item4;
    cat2Items[4].textContent = t.skills.category2Item5;
    
    // Category 3: Frameworks & Libraries
    skillCategories[2].querySelector('h3').textContent = t.skills.category3Title;
    const cat3Items = skillCategories[2].querySelectorAll('li');
    cat3Items[0].textContent = t.skills.category3Item1;
    cat3Items[1].textContent = t.skills.category3Item2;
    cat3Items[2].textContent = t.skills.category3Item3;
    cat3Items[3].textContent = t.skills.category3Item4;
    cat3Items[4].textContent = t.skills.category3Item5;
    cat3Items[5].textContent = t.skills.category3Item6;
    
    // Category 4: Programming & Tools
    skillCategories[3].querySelector('h3').textContent = t.skills.category4Title;
    const cat4Items = skillCategories[3].querySelectorAll('li');
    cat4Items[0].textContent = t.skills.category4Item1;
    cat4Items[1].textContent = t.skills.category4Item2;
    cat4Items[2].textContent = t.skills.category4Item3;
    cat4Items[3].textContent = t.skills.category4Item4;
    cat4Items[4].textContent = t.skills.category4Item5;
    
    // Certifications section
    document.querySelector('.subsection-title').textContent = t.skills.certificationsTitle;
    const certificationLinks = document.querySelectorAll('.certification-list a');
    certificationLinks[0].textContent = t.skills.cert1;
    certificationLinks[1].textContent = t.skills.cert2;
    certificationLinks[2].textContent = t.skills.cert3;
    certificationLinks[3].textContent = t.skills.cert4;
    
    // Projects section
    document.querySelector('#projects .section-title').textContent = t.projects.title;
    const projectCards = document.querySelectorAll('.project-card');
    
    // Project 1
    projectCards[0].querySelector('h3').textContent = t.projects.card1.title;
    const card1Tags = projectCards[0].querySelectorAll('.tag');
    card1Tags[0].textContent = t.projects.card1.tag1;
    card1Tags[1].textContent = t.projects.card1.tag2;
    card1Tags[2].textContent = t.projects.card1.tag3;
    card1Tags[3].textContent = t.projects.card1.tag4;
    projectCards[0].querySelector('.project-description').textContent = t.projects.card1.description;
    const card1Links = projectCards[0].querySelectorAll('.project-link');
    card1Links[0].textContent = t.projects.card1.link1Text;
    card1Links[1].textContent = t.projects.card1.link2Text;
    if (card1Links[2]) {
        card1Links[2].textContent = t.projects.card1.link3Text;
        card1Links[2].href = t.projects.card1.reportUrl;
    }
    
    // Project 2
    projectCards[1].querySelector('h3').textContent = t.projects.card2.title;
    const card2Tags = projectCards[1].querySelectorAll('.tag');
    card2Tags[0].textContent = t.projects.card2.tag1;
    card2Tags[1].textContent = t.projects.card2.tag2;
    card2Tags[2].textContent = t.projects.card2.tag3;
    card2Tags[3].textContent = t.projects.card2.tag4;
    projectCards[1].querySelector('.project-description').textContent = t.projects.card2.description;
    const card2Links = projectCards[1].querySelectorAll('.project-link');
    card2Links[0].textContent = t.projects.card2.link1Text;
    if (card2Links[1]) {
        card2Links[1].textContent = t.projects.card2.link2Text;
        card2Links[1].href = t.projects.card2.reportUrl;
    }
    
    // Project 3
    projectCards[2].querySelector('h3').textContent = t.projects.card3.title;
    const card3Tags = projectCards[2].querySelectorAll('.tag');
    card3Tags[0].textContent = t.projects.card3.tag1;
    card3Tags[1].textContent = t.projects.card3.tag2;
    card3Tags[2].textContent = t.projects.card3.tag3;
    card3Tags[3].textContent = t.projects.card3.tag4;
    projectCards[2].querySelector('.project-description').textContent = t.projects.card3.description;
    const card3Links = projectCards[2].querySelectorAll('.project-link');
    card3Links[0].textContent = t.projects.card3.link1Text;
    if (card3Links[1]) {
        card3Links[1].textContent = t.projects.card3.link2Text;
        card3Links[1].href = t.projects.card3.reportUrl;
    }
    
    // Project 4
    projectCards[3].querySelector('h3').textContent = t.projects.card4.title;
    const card4Tags = projectCards[3].querySelectorAll('.tag');
    card4Tags[0].textContent = t.projects.card4.tag1;
    card4Tags[1].textContent = t.projects.card4.tag2;
    card4Tags[2].textContent = t.projects.card4.tag3;
    projectCards[3].querySelector('.project-description').textContent = t.projects.card4.description;
    const card4Links = projectCards[3].querySelectorAll('.project-link');
    card4Links[0].textContent = t.projects.card4.link1Text;
    card4Links[1].textContent = t.projects.card4.link2Text;
    
    // Project 5
    projectCards[4].querySelector('h3').textContent = t.projects.card5.title;
    const card5Tags = projectCards[4].querySelectorAll('.tag');
    card5Tags[0].textContent = t.projects.card5.tag1;
    card5Tags[1].textContent = t.projects.card5.tag2;
    card5Tags[2].textContent = t.projects.card5.tag3;
    card5Tags[3].textContent = t.projects.card5.tag4;
    projectCards[4].querySelector('.project-description').textContent = t.projects.card5.description;
    const card5Links = projectCards[4].querySelectorAll('.project-link');
    card5Links[0].textContent = t.projects.card5.link1Text;
    card5Links[1].textContent = t.projects.card5.link2Text;
    
    // Project 6 (Music Genre Classification)
    projectCards[5].querySelector('h3').textContent = t.projects.card6.title;
    const card6Tags = projectCards[5].querySelectorAll('.tag');
    card6Tags[0].textContent = t.projects.card6.tag1;
    card6Tags[1].textContent = t.projects.card6.tag2;
    card6Tags[2].textContent = t.projects.card6.tag3;
    card6Tags[3].textContent = t.projects.card6.tag4;
    card6Tags[4].textContent = t.projects.card6.tag5;
    projectCards[5].querySelector('.project-description').textContent = t.projects.card6.description;
    const card6Links = projectCards[5].querySelectorAll('.project-link');
    card6Links[0].textContent = t.projects.card6.link1Text;
    card6Links[1].textContent = t.projects.card6.link2Text;
    
    // Project 7 (Tangram Solver)
    projectCards[6].querySelector('h3').textContent = t.projects.card7.title;
    const card7Tags = projectCards[6].querySelectorAll('.tag');
    card7Tags[0].textContent = t.projects.card7.tag1;
    card7Tags[1].textContent = t.projects.card7.tag2;
    projectCards[6].querySelector('.project-description').textContent = t.projects.card7.description;
    const card7Links = projectCards[6].querySelectorAll('.project-link');
    card7Links[0].textContent = t.projects.card7.link1Text;
    card7Links[1].textContent = t.projects.card7.link2Text;
    
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
    
    // Experience section
    document.querySelector('#experience .section-title').textContent = t.experience.title;
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Experience 1
    timelineItems[0].querySelector('h3').textContent = t.experience.item1.title;
    timelineItems[0].querySelector('.company').textContent = t.experience.item1.company;
    timelineItems[0].querySelector('.period').textContent = t.experience.item1.period;
    const exp1Achievements = timelineItems[0].querySelectorAll('.achievements li');
    exp1Achievements[0].textContent = t.experience.item1.achievement1;
    exp1Achievements[1].textContent = t.experience.item1.achievement2;
    exp1Achievements[2].textContent = t.experience.item1.achievement3;
    
    // Experience 2
    timelineItems[1].querySelector('h3').textContent = t.experience.item2.title;
    timelineItems[1].querySelector('.company').textContent = t.experience.item2.company;
    timelineItems[1].querySelector('.period').textContent = t.experience.item2.period;
    const exp2Achievements = timelineItems[1].querySelectorAll('.achievements li');
    exp2Achievements[0].textContent = t.experience.item2.achievement1;
    exp2Achievements[1].textContent = t.experience.item2.achievement2;
    exp2Achievements[2].textContent = t.experience.item2.achievement3;
    exp2Achievements[3].textContent = t.experience.item2.achievement4;
    
    // Experience 3 (Ksilink internship)
    timelineItems[2].querySelector('h3').textContent = t.experience.item3.title;
    timelineItems[2].querySelector('.company').textContent = t.experience.item3.company;
    timelineItems[2].querySelector('.period').textContent = t.experience.item3.period;
    const exp3Achievements = timelineItems[2].querySelectorAll('.achievements li');
    exp3Achievements[0].textContent = t.experience.item3.achievement1;
    exp3Achievements[1].textContent = t.experience.item3.achievement2;
    exp3Achievements[2].textContent = t.experience.item3.achievement3;
    // Handle internship report link
    const exp3ReportLink = timelineItems[2].querySelector('.internship-report-link');
    if (exp3ReportLink) {
        exp3ReportLink.textContent = t.experience.item3.reportText;
        exp3ReportLink.href = t.experience.item3.reportUrl;
    }
    
    // Experience 4 (Exchange)
    timelineItems[3].querySelector('h3').textContent = t.experience.item4.title;
    timelineItems[3].querySelector('.company').textContent = t.experience.item4.company;
    timelineItems[3].querySelector('.period').textContent = t.experience.item4.period;
    const exp4Achievements = timelineItems[3].querySelectorAll('.achievements li');
    exp4Achievements[0].textContent = t.experience.item4.achievement1;
    exp4Achievements[1].textContent = t.experience.item4.achievement2;
    exp4Achievements[2].textContent = t.experience.item4.achievement3;
    
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
    
    // Footer
    document.querySelector('.footer p').textContent = t.footer.copyright;
}

// Set language and update interface
function setLanguage(lang) {
    console.log('setLanguage called with:', lang);
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    // Update language toggle button
    const languageIcon = document.querySelector('.language-icon');
    if (languageIcon) {
        // Show the flag of the language you can switch TO
        if (lang === 'en') {
            // Show French flag (can switch to French)
            languageIcon.className = 'language-icon fi fi-fr';
        } else {
            // Show UK flag (can switch to English)
            languageIcon.className = 'language-icon fi fi-gb';
        }
        console.log('Language icon updated with flag-icons');
    } else {
        console.warn('Language icon element not found');
    }
    
    // Update page HTML lang attribute
    document.documentElement.lang = lang;
    
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

/*
// Pathfinding Maze Visualization
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('maze-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const CELL_SIZE = 16; // Increased from 8 to reduce maze complexity
    let MAZE_WIDTH, MAZE_HEIGHT;
    let maze = [];
    let path = [];
    let currentPathIndex = 0;
    let isPathfinding = false;
    let currentAlgorithm = 0;
    let algorithmsUsedOnCurrentMaze = 0;
    let startX, startY, endX, endY;

    // Available algorithms
    const algorithms = ['A*', 'Dijkstra', 'BFS', 'Greedy Best-First', 'DFS', 'Bidirectional'];
    const algorithmSpeeds = {
        'A*': 25,                // Much faster for A*
        'Dijkstra': 20,          // Much faster for Dijkstra
        'BFS': 18,               // Much faster for BFS  
        'Greedy Best-First': 30, // Much faster for Greedy
        'DFS': 15,               // Much faster for DFS
        'Bidirectional': 22      // Much faster for Bidirectional
    };

    // Colors
    const COLORS = {
        WALL: '#2c3e50',
        EMPTY: '#ecf0f1',
        START: '#27ae60',
        END: '#e74c3c',
        PATH: '#3498db',
        VISITED: '#95a5a6'
    };

    function resizeCanvas() {
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        MAZE_WIDTH = Math.floor(canvas.width / CELL_SIZE);
        MAZE_HEIGHT = Math.floor(canvas.height / CELL_SIZE);
        
        // Position start point lower to avoid header (around 10% from top)
        startX = 1;
        startY = Math.floor(MAZE_HEIGHT * 0.15); // Start lower to avoid header
        
        // Position end point
        endX = MAZE_WIDTH - 2;
        endY = MAZE_HEIGHT - 2;
    }

    function generateMaze() {
        maze = [];
        algorithmsUsedOnCurrentMaze = 0; // Reset counter when generating new maze
        // Initialize all as walls
        for (let y = 0; y < MAZE_HEIGHT; y++) {
            maze[y] = [];
            for (let x = 0; x < MAZE_WIDTH; x++) {
                maze[y][x] = 1; // Wall
            }
        }

        // Use recursive backtracking for more interesting maze patterns
        const visited = new Set();
        
        function isValid(x, y) {
            return x > 0 && x < MAZE_WIDTH - 1 && y > 0 && y < MAZE_HEIGHT - 1;
        }
        
        function getUnvisitedNeighbors(x, y) {
            const neighbors = [];
            const directions = [
                [0, -2], [2, 0], [0, 2], [-2, 0] // Move by 2 to leave walls between
            ];
            
            for (const [dx, dy] of directions) {
                const newX = x + dx;
                const newY = y + dy;
                if (isValid(newX, newY) && !visited.has(`${newX},${newY}`)) {
                    neighbors.push([newX, newY]);
                }
            }
            return neighbors;
        }
        
        function carvePath(x, y) {
            maze[y][x] = 0;
            visited.add(`${x},${y}`);
            
            const neighbors = getUnvisitedNeighbors(x, y);
            // Shuffle neighbors for randomness
            for (let i = neighbors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
            }
            
            for (const [newX, newY] of neighbors) {
                if (!visited.has(`${newX},${newY}`)) {
                    // Carve the wall between current and next cell
                    const wallX = x + (newX - x) / 2;
                    const wallY = y + (newY - y) / 2;
                    maze[wallY][wallX] = 0;
                    carvePath(newX, newY);
                }
            }
        }
        
        // Start carving from a random odd position
        const startCarveX = 1 + Math.floor(Math.random() * Math.floor((MAZE_WIDTH - 2) / 2)) * 2;
        const startCarveY = 1 + Math.floor(Math.random() * Math.floor((MAZE_HEIGHT - 2) / 2)) * 2;
        carvePath(startCarveX, startCarveY);
        
        // Add some random openings to make it less dense (20% chance for each cell)
        for (let y = 1; y < MAZE_HEIGHT - 1; y++) {
            for (let x = 1; x < MAZE_WIDTH - 1; x++) {
                if (maze[y][x] === 1 && Math.random() < 0.15) {
                    maze[y][x] = 0;
                }
            }
        }
        
        // Create some wider corridors
        for (let i = 0; i < Math.floor((MAZE_WIDTH + MAZE_HEIGHT) / 8); i++) {
            const x = Math.floor(Math.random() * (MAZE_WIDTH - 4)) + 2;
            const y = Math.floor(Math.random() * (MAZE_HEIGHT - 4)) + 2;
            
            // Create a 2x2 or 3x3 open area
            const size = Math.random() < 0.7 ? 2 : 3;
            for (let dy = 0; dy < size && y + dy < MAZE_HEIGHT - 1; dy++) {
                for (let dx = 0; dx < size && x + dx < MAZE_WIDTH - 1; dx++) {
                    maze[y + dy][x + dx] = 0;
                }
            }
        }

        // Ensure start and end points are always accessible
        maze[startY][startX] = 0;
        maze[endY][endX] = 0;
        
        // Create guaranteed paths from start and end to nearby areas
        const directionsToCarve = [
            [0, 1], [1, 0], [0, -1], [-1, 0]
        ];
        
        // From start point
        for (const [dx, dy] of directionsToCarve) {
            const newX = startX + dx;
            const newY = startY + dy;
            if (newX > 0 && newX < MAZE_WIDTH - 1 && newY > 0 && newY < MAZE_HEIGHT - 1) {
                maze[newY][newX] = 0;
            }
        }
        
        // From end point  
        for (const [dx, dy] of directionsToCarve) {
            const newX = endX + dx;
            const newY = endY + dy;
            if (newX > 0 && newX < MAZE_WIDTH - 1 && newY > 0 && newY < MAZE_HEIGHT - 1) {
                maze[newY][newX] = 0;
            }
        }
    }

    function drawMaze() {
        ctx.fillStyle = COLORS.WALL;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < MAZE_HEIGHT; y++) {
            for (let x = 0; x < MAZE_WIDTH; x++) {
                const cellX = x * CELL_SIZE;
                const cellY = y * CELL_SIZE;

                if (maze[y][x] === 0) {
                    ctx.fillStyle = COLORS.EMPTY;
                    ctx.fillRect(cellX, cellY, CELL_SIZE, CELL_SIZE);
                }
            }
        }

        // Draw start point
        ctx.fillStyle = COLORS.START;
        ctx.fillRect(startX * CELL_SIZE, startY * CELL_SIZE, CELL_SIZE, CELL_SIZE);

        // Draw end point
        ctx.fillStyle = COLORS.END;
        ctx.fillRect(endX * CELL_SIZE, endY * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        
        // Draw algorithm label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillRect(10, 10, ctx.measureText(`Algorithm: ${algorithms[currentAlgorithm]}`).width + 20, 30);
        ctx.fillStyle = '#2c3e50';
        ctx.fillText(`Algorithm: ${algorithms[currentAlgorithm]}`, 20, 30);
    }

    function drawPath() {
        if (path.length === 0) return;

        ctx.strokeStyle = COLORS.PATH;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        const startPoint = path[0];
        ctx.moveTo(startPoint.x * CELL_SIZE + CELL_SIZE / 2, startPoint.y * CELL_SIZE + CELL_SIZE / 2);

        // Draw path progressively
        for (let i = 1; i <= Math.min(currentPathIndex, path.length - 1); i++) {
            const point = path[i];
            ctx.lineTo(point.x * CELL_SIZE + CELL_SIZE / 2, point.y * CELL_SIZE + CELL_SIZE / 2);
        }
        ctx.stroke();
    }

    // Dijkstra's Algorithm
    function dijkstra(start, end) {
        const distances = {};
        const previous = {};
        const unvisited = [];
        
        // Initialize distances
        for (let y = 0; y < MAZE_HEIGHT; y++) {
            for (let x = 0; x < MAZE_WIDTH; x++) {
                if (maze[y][x] === 0) {
                    const key = `${x},${y}`;
                    distances[key] = Infinity;
                    previous[key] = null;
                    unvisited.push({ x, y });
                }
            }
        }
        
        distances[`${start.x},${start.y}`] = 0;
        
        while (unvisited.length > 0) {
            // Find unvisited node with minimum distance
            unvisited.sort((a, b) => distances[`${a.x},${a.y}`] - distances[`${b.x},${b.y}`]);
            const current = unvisited.shift();
            
            if (!current) break;
            
            const currentKey = `${current.x},${current.y}`;
            const currentDistance = distances[currentKey];
            
            if (currentDistance === Infinity) break;
            
            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const path = [];
                let temp = current;
                while (temp) {
                    path.unshift(temp);
                    temp = previous[`${temp.x},${temp.y}`];
                }
                return path;
            }
            
            // Check neighbors
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                const alt = currentDistance + 1;
                
                if (alt < distances[neighborKey]) {
                    distances[neighborKey] = alt;
                    previous[neighborKey] = current;
                }
            }
        }
        
        return []; // No path found
    }

    // Breadth-First Search (BFS)
    function bfs(start, end) {
        const queue = [start];
        const visited = new Set([`${start.x},${start.y}`]);
        const previous = {};
        
        while (queue.length > 0) {
            const current = queue.shift();
            
            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const path = [];
                let temp = current;
                while (temp) {
                    path.unshift(temp);
                    temp = previous[`${temp.x},${temp.y}`];
                }
                return path;
            }
            
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    previous[neighborKey] = current;
                    queue.push(neighbor);
                }
            }
        }
        
        return []; // No path found
    }

    // Greedy Best-First Search
    function greedyBestFirst(start, end) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = {};

        while (openSet.length > 0) {
            // Sort by heuristic (closest to goal first)
            openSet.sort((a, b) => heuristic(a, end) - heuristic(b, end));
            const current = openSet.shift();

            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const reconstructedPath = [];
                let temp = current;
                while (temp) {
                    reconstructedPath.unshift(temp);
                    temp = cameFrom[`${temp.x},${temp.y}`];
                }
                return reconstructedPath;
            }

            closedSet.push(current);

            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    continue;
                }

                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    cameFrom[neighborKey] = current;
                    openSet.push(neighbor);
                }
            }
        }

        return []; // No path found
    }

    // Depth-First Search (DFS)
    function dfs(start, end) {
        const stack = [start];
        const visited = new Set([`${start.x},${start.y}`]);
        const previous = {};

        while (stack.length > 0) {
            const current = stack.pop();

            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const path = [];
                let temp = current;
                while (temp) {
                    path.unshift(temp);
                    temp = previous[`${temp.x},${temp.y}`];
                }
                return path;
            }

            const neighbors = getNeighbors(current);
            // Shuffle neighbors for randomness in DFS
            for (let i = neighbors.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
            }

            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                if (!visited.has(neighborKey)) {
                    visited.add(neighborKey);
                    previous[neighborKey] = current;
                    stack.push(neighbor);
                }
            }
        }

        return []; // No path found
    }

    // Bidirectional Search
    function bidirectionalSearch(start, end) {
        const forwardQueue = [start];
        const backwardQueue = [end];
        const forwardVisited = new Map([[`${start.x},${start.y}`, start]]);
        const backwardVisited = new Map([[`${end.x},${end.y}`, end]]);
        const forwardParent = {};
        const backwardParent = {};

        while (forwardQueue.length > 0 && backwardQueue.length > 0) {
            // Forward search
            if (forwardQueue.length > 0) {
                const current = forwardQueue.shift();
                const currentKey = `${current.x},${current.y}`;

                if (backwardVisited.has(currentKey)) {
                    // Found intersection, reconstruct path
                    const forwardPath = [];
                    let temp = current;
                    while (temp) {
                        forwardPath.unshift(temp);
                        temp = forwardParent[`${temp.x},${temp.y}`];
                    }

                    const backwardPath = [];
                    temp = backwardVisited.get(currentKey);
                    temp = backwardParent[`${temp.x},${temp.y}`];
                    while (temp) {
                        backwardPath.push(temp);
                        temp = backwardParent[`${temp.x},${temp.y}`];
                    }

                    return [...forwardPath, ...backwardPath];
                }

                const neighbors = getNeighbors(current);
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.x},${neighbor.y}`;
                    if (!forwardVisited.has(neighborKey)) {
                        forwardVisited.set(neighborKey, neighbor);
                        forwardParent[neighborKey] = current;
                        forwardQueue.push(neighbor);
                    }
                }
            }

            // Backward search
            if (backwardQueue.length > 0) {
                const current = backwardQueue.shift();
                const currentKey = `${current.x},${current.y}`;

                if (forwardVisited.has(currentKey)) {
                    // Found intersection, reconstruct path
                    const forwardPath = [];
                    let temp = forwardVisited.get(currentKey);
                    while (temp) {
                        forwardPath.unshift(temp);
                        temp = forwardParent[`${temp.x},${temp.y}`];
                    }

                    const backwardPath = [];
                    temp = backwardParent[currentKey];
                    while (temp) {
                        backwardPath.push(temp);
                        temp = backwardParent[`${temp.x},${temp.y}`];
                    }

                    return [...forwardPath, ...backwardPath];
                }

                const neighbors = getNeighbors(current);
                for (const neighbor of neighbors) {
                    const neighborKey = `${neighbor.x},${neighbor.y}`;
                    if (!backwardVisited.has(neighborKey)) {
                        backwardVisited.set(neighborKey, neighbor);
                        backwardParent[neighborKey] = current;
                        backwardQueue.push(neighbor);
                    }
                }
            }
        }

        return []; // No path found
    }

    // A* Pathfinding Algorithm
    function aStar(start, end) {
        const openSet = [start];
        const closedSet = [];
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        gScore[`${start.x},${start.y}`] = 0;
        fScore[`${start.x},${start.y}`] = heuristic(start, end);

        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet.reduce((lowest, node) => {
                const currentKey = `${node.x},${node.y}`;
                const lowestKey = `${lowest.x},${lowest.y}`;
                return fScore[currentKey] < fScore[lowestKey] ? node : lowest;
            });

            const currentKey = `${current.x},${current.y}`;

            if (current.x === end.x && current.y === end.y) {
                // Reconstruct path
                const reconstructedPath = [];
                let temp = current;
                while (temp) {
                    reconstructedPath.unshift(temp);
                    temp = cameFrom[`${temp.x},${temp.y}`];
                }
                return reconstructedPath;
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.push(current);

            // Check neighbors
            const neighbors = getNeighbors(current);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                if (closedSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    continue;
                }

                const tentativeGScore = gScore[currentKey] + 1;

                if (!openSet.some(node => node.x === neighbor.x && node.y === neighbor.y)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
                    continue;
                }

                cameFrom[neighborKey] = current;
                gScore[neighborKey] = tentativeGScore;
                fScore[neighborKey] = gScore[neighborKey] + heuristic(neighbor, end);
            }
        }

        return []; // No path found
    }

    function heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    function getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: 0, y: -1 }, // Up
            { x: 1, y: 0 },  // Right
            { x: 0, y: 1 },  // Down
            { x: -1, y: 0 }  // Left
        ];

        for (const dir of directions) {
            const newX = node.x + dir.x;
            const newY = node.y + dir.y;

            if (newX >= 0 && newX < MAZE_WIDTH && 
                newY >= 0 && newY < MAZE_HEIGHT && 
                maze[newY][newX] === 0) {
                neighbors.push({ x: newX, y: newY });
            }
        }

        return neighbors;
    }

    function animatePathfinding() {
        if (!isPathfinding) return;

        currentPathIndex++;
        if (currentPathIndex >= path.length) {
            currentPathIndex = 0;
            algorithmsUsedOnCurrentMaze++;
            
            // Cycle to next algorithm
            currentAlgorithm = (currentAlgorithm + 1) % algorithms.length;
            
            setTimeout(() => {
                // Only generate new maze if all algorithms have been tried
                if (algorithmsUsedOnCurrentMaze >= algorithms.length) {
                    algorithmsUsedOnCurrentMaze = 0;
                    generateMaze();
                }
                findAndAnimatePath();
            }, 1500);
            return;
        }

        drawMaze();
        drawPath();

        // Use dynamic speed based on current algorithm
        const currentAlgoName = algorithms[currentAlgorithm];
        const speed = algorithmSpeeds[currentAlgoName];
        setTimeout(animatePathfinding, speed);
    }

    function findAndAnimatePath() {
        const start = { x: startX, y: startY };
        const end = { x: endX, y: endY };
        
        // Use different algorithm based on current selection
        const algorithmName = algorithms[currentAlgorithm];
        
        switch (algorithmName) {
            case 'A*':
                path = aStar(start, end);
                break;
            case 'Dijkstra':
                path = dijkstra(start, end);
                break;
            case 'BFS':
                path = bfs(start, end);
                break;
            case 'Greedy Best-First':
                path = greedyBestFirst(start, end);
                break;
            case 'DFS':
                path = dfs(start, end);
                break;
            case 'Bidirectional':
                path = bidirectionalSearch(start, end);
                break;
        }
        
        currentPathIndex = 0;
        
        // Display current algorithm (optional - you can remove this if you don't want it)
        console.log(`Using ${algorithmName} algorithm - Path length: ${path.length}`);
        
        if (path.length > 0) {
            isPathfinding = true;
            animatePathfinding();
        } else {
            // If no path found, regenerate maze (though this should be rare now)
            setTimeout(() => {
                generateMaze();
                findAndAnimatePath();
            }, 500);
        }
    }

    function init() {
        resizeCanvas();
        generateMaze();
        findAndAnimatePath();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
        generateMaze();
        findAndAnimatePath();
    });

    init();
});
*/

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
        ctx.lineWidth = 8;
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
        return {
            x: e.touches[0].clientX - rect.left,
            y: e.touches[0].clientY - rect.top
        };
    }
    
    function handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type.replace('touch', 'mouse'), {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }
    
    // Event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', handleTouch);
    
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
            predictionTable.innerHTML = `<div class="prediction-row"><span class="digit">${placeholder}</span></div>`;
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
    loadModel();
});