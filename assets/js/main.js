// ===== MAIN JAVASCRIPT FILE =====

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeComponents();
    setupEventListeners();
    initializeAnimations();
});

// ===== COMPONENT INITIALIZATION =====
function initializeComponents() {
    // Initialize tooltips
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
    
    // Initialize popovers
    if (typeof bootstrap !== 'undefined') {
        const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl);
        });
    }
    
    // Initialize product image hover effects
    initializeProductHoverEffects();
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
    
    // Initialize lazy loading
    initializeLazyLoading();
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
    // Search form submission
    const searchForm = document.querySelector('form[action="/search"]');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
    
    // Product card interactions
    const productCards = document.querySelectorAll('.product-card');
    productCards.forEach(card => {
        card.addEventListener('mouseenter', handleProductCardHover);
        card.addEventListener('mouseleave', handleProductCardLeave);
        card.addEventListener('click', handleProductCardClick);
    });
    
    // Banner interactions
    const banners = document.querySelectorAll('.featured-banner, .promotional-banner');
    banners.forEach(banner => {
        banner.addEventListener('mouseenter', handleBannerHover);
        banner.addEventListener('mouseleave', handleBannerLeave);
    });
    
    // Navigation interactions
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavLinkClick);
    });
    
    // Scroll events
    window.addEventListener('scroll', handleScroll);
    
    // Resize events
    window.addEventListener('resize', handleResize);
}

// ===== ANIMATION INITIALIZATION =====
function initializeAnimations() {
    // Initialize AOS (Animate On Scroll) if available
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100,
            delay: 0
        });
    }
    
    // Custom scroll animations
    initializeScrollAnimations();
    
    // Parallax effects
    initializeParallaxEffects();
}

// ===== PRODUCT HOVER EFFECTS =====
function initializeProductHoverEffects() {
    const productImages = document.querySelectorAll('.product-image');
    
    productImages.forEach(imageContainer => {
        const primaryImage = imageContainer.querySelector('.primary-image');
        const hoverImage = imageContainer.querySelector('.hover-image');
        
        if (primaryImage && hoverImage) {
            // Preload hover image
            const img = new Image();
            img.src = hoverImage.src;
            
            // Add loading class
            imageContainer.classList.add('image-loaded');
        }
    });
}

function handleProductCardHover(event) {
    const card = event.currentTarget;
    const imageContainer = card.querySelector('.product-image');
    
    if (imageContainer) {
        imageContainer.style.transform = 'scale(1.02)';
    }
    
    // Add hover class
    card.classList.add('card-hovered');
}

function handleProductCardLeave(event) {
    const card = event.currentTarget;
    const imageContainer = card.querySelector('.product-image');
    
    if (imageContainer) {
        imageContainer.style.transform = 'scale(1)';
    }
    
    // Remove hover class
    card.classList.remove('card-hovered');
}

function handleProductCardClick(event) {
    const card = event.currentTarget;
    const link = card.querySelector('a[href]');
    
    if (link && !event.target.closest('a')) {
        // Add click animation
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = 'scale(1)';
            window.location.href = link.href;
        }, 150);
    }
}

// ===== BANNER INTERACTIONS =====
function handleBannerHover(event) {
    const banner = event.currentTarget;
    const image = banner.querySelector('img');
    
    if (image) {
        image.style.transform = 'scale(1.05)';
    }
    
    // Add hover class
    banner.classList.add('banner-hovered');
}

function handleBannerLeave(event) {
    const banner = event.currentTarget;
    const image = banner.querySelector('img');
    
    if (image) {
        image.style.transform = 'scale(1)';
    }
    
    // Remove hover class
    banner.classList.remove('banner-hovered');
}

// ===== NAVIGATION INTERACTIONS =====
function handleNavLinkClick(event) {
    const link = event.currentTarget;
    const targetId = link.getAttribute('href');
    
    // Smooth scroll to section if it's an anchor link
    if (targetId.startsWith('#')) {
        event.preventDefault();
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
    
    // Add active state
    document.querySelectorAll('.navbar-nav .nav-link').forEach(navLink => {
        navLink.classList.remove('active');
    });
    link.classList.add('active');
}

// ===== SEARCH FUNCTIONALITY =====
function handleSearchSubmit(event) {
    const searchInput = event.target.querySelector('input[name="q"]');
    const searchQuery = searchInput.value.trim();
    
    if (!searchQuery) {
        event.preventDefault();
        searchInput.focus();
        showNotification('Please enter a search term', 'warning');
        return;
    }
    
    // Add loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitButton.disabled = true;
    }
}

// ===== SCROLL HANDLERS =====
function handleScroll() {
    const scrollTop = window.pageYOffset;
    const header = document.querySelector('.header');
    
    // Header scroll effect
    if (header) {
        if (scrollTop > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    }
    
    // Parallax effects
    updateParallaxEffects(scrollTop);
    
    // Scroll animations
    updateScrollAnimations(scrollTop);
}

function handleResize() {
    // Recalculate dimensions and positions
    updateLayout();
    
    // Reinitialize components if needed
    if (window.innerWidth < 768) {
        // Mobile-specific adjustments
        adjustMobileLayout();
    }
}

// ===== SMOOTH SCROLLING =====
function initializeSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ===== LAZY LOADING =====
function initializeLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ===== SCROLL ANIMATIONS =====
function initializeScrollAnimations() {
    const animatedElements = document.querySelectorAll('[data-scroll-animation]');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.scrollAnimation;
                    element.classList.add(animation);
                    animationObserver.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(element => {
            animationObserver.observe(element);
        });
    }
}

function updateScrollAnimations(scrollTop) {
    // Custom scroll-based animations
    const elements = document.querySelectorAll('[data-parallax]');
    elements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollTop * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
}

// ===== PARALLAX EFFECTS =====
function initializeParallaxEffects() {
    // Initialize parallax for hero sections
    const heroSections = document.querySelectorAll('.hero-slider-section');
    heroSections.forEach(section => {
        section.setAttribute('data-parallax', '0.3');
    });
}

function updateParallaxEffects(scrollTop) {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrollTop * speed);
        element.style.transform = `translateY(${yPos}px)`;
    });
}

// ===== LAYOUT UPDATES =====
function updateLayout() {
    // Update any layout-dependent calculations
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function adjustMobileLayout() {
    // Mobile-specific layout adjustments
    const heroSection = document.querySelector('.hero-slider-section');
    if (heroSection) {
        heroSection.style.height = '60vh';
    }
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification(notification);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        hideNotification(notification);
    });
}

function hideNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ===== UTILITY FUNCTIONS =====
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===== PERFORMANCE OPTIMIZATION =====
// Throttle scroll and resize events
const throttledScroll = throttle(handleScroll, 16); // 60fps
const throttledResize = throttle(handleResize, 100);

window.addEventListener('scroll', throttledScroll);
window.addEventListener('resize', throttledResize);

// ===== EXPORT FOR GLOBAL USE =====
window.FurnitureShowcase = {
    showNotification,
    initializeComponents,
    updateLayout
};