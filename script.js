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

// Konami Code Easter Egg
document.addEventListener('DOMContentLoaded', function() {
    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'
    ];
    let konamiIndex = 0;
    
    document.addEventListener('keydown', function(e) {
        if (e.code === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                activateEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
    
    // Alternative trigger via easter egg element
    const easterEggTrigger = document.getElementById('konami-hint');
    if (easterEggTrigger) {
        let clickCount = 0;
        easterEggTrigger.addEventListener('click', function() {
            clickCount++;
            this.style.transform = `scale(${1 + clickCount * 0.1}) rotate(${clickCount * 36}deg)`;
            
            if (clickCount >= 5) {
                activateEasterEgg();
                clickCount = 0;
                this.style.transform = 'scale(1) rotate(0deg)';
            }
            
            // Reset after 2 seconds
            setTimeout(() => {
                if (clickCount < 5) {
                    clickCount = 0;
                    this.style.transform = 'scale(1) rotate(0deg)';
                }
            }, 2000);
        });
    }
    
    function activateEasterEgg() {
        const modal = document.getElementById('easter-egg-modal');
        if (modal) {
            modal.style.display = 'block';
            createConfetti();
            playAchievementSound();
            document.body.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 500);
        }
    }
    
    // Close modal functionality
    const closeModal = document.querySelector('.close');
    const modal = document.getElementById('easter-egg-modal');
    
    if (closeModal && modal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
        
        window.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});

// Confetti Effect
function createConfetti() {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 10 + 5 + 'px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '10001';
        confetti.style.borderRadius = '50%';
        
        document.body.appendChild(confetti);
        
        const fallAnimation = confetti.animate([
            { transform: 'translateY(-10px) rotate(0deg)', opacity: 1 },
            { transform: `translateY(100vh) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: Math.random() * 3000 + 2000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });
        
        fallAnimation.addEventListener('finish', () => {
            confetti.remove();
        });
    }
}

// Achievement Sound
function playAchievementSound() {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const audioContext = new (AudioContext || webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

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
document.addEventListener('DOMContentLoaded', function() {
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
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
                }, 1000);
            }
        }
        
        // Start typing after a delay
        setTimeout(typeWriter, 1500);
    }
});

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
                // For now, let's use a simple mailto fallback since Formspree requires setup
                const name = formData.get('name');
                const email = formData.get('email');
                const message = formData.get('message');
                
                // Create mailto URL
                const subject = `Portfolio Contact from ${name}`;
                const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
                const mailtoUrl = `mailto:leon.morales@utbm.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                
                // Open email client
                window.open(mailtoUrl);
                
                // Show success message
                formStatus.innerHTML = '<div class="form-success">✓ Email client opened! Please send the email from your email application.</div>';
                contactForm.reset();
                
            } catch (error) {
                // Show error message
                formStatus.innerHTML = '<div class="form-error">✗ Something went wrong. Please try again or email me directly.</div>';
            } finally {
                // Reset button state
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
                submitBtn.disabled = false;
            }
        });
    }
});

console.log('🚀 Portfolio website loaded successfully!');

// Interactive Basketball Physics
document.addEventListener('DOMContentLoaded', function() {
    const basketball = document.getElementById('interactive-basketball');
    if (!basketball) return;

    let isDragging = false;
    let isAnimating = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let animationId = null;

    const gravity = 0.5;
    const bounce = 0.8;
    const friction = 0.99;
    const minVelocity = 0.5;

    // Get initial position
    let x = 20;
    let y = window.innerHeight / 2;
    basketball.style.left = x + 'px';
    basketball.style.top = y + 'px';

    // Mouse events
    basketball.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);

    // Touch events for mobile
    basketball.addEventListener('touchstart', startDragTouch, { passive: false });
    document.addEventListener('touchmove', dragTouch, { passive: false });
    document.addEventListener('touchend', endDragTouch);

    function startDrag(e) {
        e.preventDefault();
        isDragging = true;
        basketball.classList.add('dragging');
        
        if (animationId) {
            cancelAnimationFrame(animationId);
            isAnimating = false;
        }

        const rect = basketball.getBoundingClientRect();
        lastX = e.clientX;
        lastY = e.clientY;
        
        // Calculate offset from center
        const offsetX = e.clientX - rect.left - rect.width / 2;
        const offsetY = e.clientY - rect.top - rect.height / 2;
        
        basketball.setAttribute('data-offset-x', offsetX);
        basketball.setAttribute('data-offset-y', offsetY);
    }

    function startDragTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startDrag(mouseEvent);
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        const offsetX = parseFloat(basketball.getAttribute('data-offset-x')) || 0;
        const offsetY = parseFloat(basketball.getAttribute('data-offset-y')) || 0;
        
        x = e.clientX - offsetX;
        y = e.clientY - offsetY;
        
        // Calculate velocity based on movement
        velocityX = (e.clientX - lastX) * 0.5;
        velocityY = (e.clientY - lastY) * 0.5;
        
        lastX = e.clientX;
        lastY = e.clientY;
        
        basketball.style.left = x + 'px';
        basketball.style.top = y + 'px';
    }

    function dragTouch(e) {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        drag(mouseEvent);
    }

    function endDrag(e) {
        if (!isDragging) return;
        
        isDragging = false;
        basketball.classList.remove('dragging');
        
        // Start physics animation if there's significant velocity
        if (Math.abs(velocityX) > minVelocity || Math.abs(velocityY) > minVelocity) {
            startBouncing();
        }
    }

    function endDragTouch(e) {
        endDrag(e);
    }

    function startBouncing() {
        isAnimating = true;
        basketball.classList.add('bouncing');
        animate();
    }

    function animate() {
        if (!isAnimating) return;

        // Apply gravity
        velocityY += gravity;
        
        // Update position
        x += velocityX;
        y += velocityY;
        
        // Get window dimensions
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const basketballSize = 48; // Approximate size of the emoji
        
        // Bounce off walls
        if (x <= 0) {
            x = 0;
            velocityX = -velocityX * bounce;
        } else if (x >= windowWidth - basketballSize) {
            x = windowWidth - basketballSize;
            velocityX = -velocityX * bounce;
        }
        
        // Bounce off floor and ceiling
        if (y <= 0) {
            y = 0;
            velocityY = -velocityY * bounce;
        } else if (y >= windowHeight - basketballSize) {
            y = windowHeight - basketballSize;
            velocityY = -velocityY * bounce;
            
            // Add some rotation when hitting the ground
            basketball.style.transform = 'rotate(' + (Math.random() * 20 - 10) + 'deg)';
            setTimeout(() => {
                basketball.style.transform = 'rotate(0deg)';
            }, 200);
        }
        
        // Apply friction
        velocityX *= friction;
        velocityY *= friction;
        
        // Stop animation if velocity is too low
        if (Math.abs(velocityX) < minVelocity && Math.abs(velocityY) < minVelocity && y >= windowHeight - basketballSize - 5) {
            isAnimating = false;
            basketball.classList.remove('bouncing');
            return;
        }
        
        // Update position
        basketball.style.left = x + 'px';
        basketball.style.top = y + 'px';
        
        animationId = requestAnimationFrame(animate);
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const basketballSize = 48;
        
        // Keep basketball within bounds
        if (x > windowWidth - basketballSize) {
            x = windowWidth - basketballSize;
        }
        if (y > windowHeight - basketballSize) {
            y = windowHeight - basketballSize;
        }
        
        basketball.style.left = x + 'px';
        basketball.style.top = y + 'px';
    });
});

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