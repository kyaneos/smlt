/**
 * Main JavaScript file for the Scientific Method Learning Tool
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active class to current nav item
    const currentPath = window.location.pathname;
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        const linkPath = link.getAttribute('href');
        if (currentPath === linkPath || 
            (linkPath !== '/' && currentPath.startsWith(linkPath))) {
            link.classList.add('active');
        }
    });

    // Any interactive elements that need initialization
    initInteractiveElements();
});

/**
 * Initialize interactive elements across the site
 */
function initInteractiveElements() {
    // For any SVG elements that need interaction
    document.querySelectorAll('.interactive-svg').forEach(svg => {
        svg.addEventListener('click', function() {
            // Handle interactive SVG clicks
            toggleSvgInteraction(this);
        });
    });

    // Example function for toggling SVG interactivity
    function toggleSvgInteraction(element) {
        element.classList.toggle('active');
        const target = element.getAttribute('data-target');
        if (target) {
            document.getElementById(target).classList.toggle('d-none');
        }
    }
}

/**
 * Display a formatted message to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of message (success, danger, info, warning)
 */
function showMessage(message, type = 'info') {
    const alertContainer = document.createElement('div');
    alertContainer.className = `alert alert-${type} alert-dismissible fade show`;
    alertContainer.setAttribute('role', 'alert');
    
    alertContainer.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Find a place to add the alert
    const main = document.querySelector('main');
    if (main) {
        main.prepend(alertContainer);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            const alert = bootstrap.Alert.getOrCreateInstance(alertContainer);
            alert.close();
        }, 5000);
    }
}
