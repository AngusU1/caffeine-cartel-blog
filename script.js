// Initialize subscriber count from localStorage or default value
let subscriberCount = parseInt(localStorage.getItem('subscriberCount')) || 1247;

// Mailchimp Web App URL - Replace with your actual URL from Mailchimp API
// IMPORTANT: Update this URL after deploying your Mailchimp API
const MAILCHIMP_API_URL = 'YOUR_MAILCHIMP_API_URL_HERE';

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const newsletterForm = document.getElementById('newsletterForm');
const emailInput = document.getElementById('emailInput');
const subscriberCountElement = document.getElementById('subscriberCount');

// Update subscriber count display
function updateSubscriberCount() {
    subscriberCountElement.textContent = subscriberCount.toLocaleString();
    localStorage.setItem('subscriberCount', subscriberCount);
}

// Initialize counter on page load
document.addEventListener('DOMContentLoaded', function() {
    updateSubscriberCount();
    
    // Add smooth scroll behavior for anchor links only (not external/page links)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Only prevent default for actual anchor links, not empty hrefs
            if (href && href !== '#' && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
});

// Search functionality
function performSearch() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (searchTerm === '') {
        showSearchMessage('Please enter a search term');
        return;
    }
    
    // Get all blog cards
    const blogCards = document.querySelectorAll('.blog-card');
    const featuredArticle = document.querySelector('.featured-article');
    let foundResults = 0;
    
    // Search through blog cards
    blogCards.forEach(card => {
        const title = card.querySelector('.blog-title').textContent.toLowerCase();
        const excerpt = card.querySelector('.blog-excerpt').textContent.toLowerCase();
        const category = card.querySelector('.category').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || excerpt.includes(searchTerm) || category.includes(searchTerm)) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease-in';
            foundResults++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Search featured article
    const featuredTitle = featuredArticle.querySelector('.featured-title').textContent.toLowerCase();
    const featuredExcerpt = featuredArticle.querySelector('.featured-excerpt').textContent.toLowerCase();
    const featuredCategory = featuredArticle.querySelector('.category').textContent.toLowerCase();
    
    if (featuredTitle.includes(searchTerm) || featuredExcerpt.includes(searchTerm) || featuredCategory.includes(searchTerm)) {
        featuredArticle.style.display = 'block';
        foundResults++;
    } else {
        featuredArticle.style.display = 'none';
    }
    
    // Show search results message
    if (foundResults === 0) {
        showSearchMessage(`No results found for "${searchTerm}". Try different keywords.`);
    } else {
        showSearchMessage(`Found ${foundResults} result(s) for "${searchTerm}"`);
    }
    
    // Scroll to results
    document.querySelector('.main-content').scrollIntoView({
        behavior: 'smooth'
    });
}

// Clear search and show all articles
function clearSearch() {
    const blogCards = document.querySelectorAll('.blog-card');
    const featuredArticle = document.querySelector('.featured-article');
    
    blogCards.forEach(card => {
        card.style.display = 'block';
    });
    
    featuredArticle.style.display = 'block';
    
    // Remove search message
    const existingMessage = document.querySelector('.search-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Show search message
function showSearchMessage(message) {
    // Remove existing message
    const existingMessage = document.querySelector('.search-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = 'search-message';
    messageDiv.innerHTML = `
        <div style="
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 10px;
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
            color: #495057;
        ">
            ${message}
            <button onclick="clearSearch()" style="
                margin-left: 1rem;
                padding: 0.5rem 1rem;
                background: #f4a261;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">Show All</button>
        </div>
    `;
    
    // Insert message before blog posts section
    const blogSection = document.querySelector('.blog-posts-section');
    blogSection.parentNode.insertBefore(messageDiv, blogSection);
}

// Newsletter signup functionality
async function handleNewsletterSignup(e) {
    e.preventDefault();
    
    const email = emailInput.value.trim();
    
    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Show loading state
    const submitButton = newsletterForm.querySelector('button');
    const originalText = submitButton.textContent;
    
    submitButton.textContent = 'Subscribing...';
    submitButton.disabled = true;
    
    try {
        // Check if Mailchimp API URL is configured
        if (MAILCHIMP_API_URL === 'YOUR_MAILCHIMP_API_URL_HERE') {
            throw new Error('Mailchimp integration not configured. Please set up your Mailchimp API first.');
        }
        
        // Send data to Mailchimp via API using URLSearchParams
        const params = new URLSearchParams();
        params.append('email', email);
        
        const response = await fetch(MAILCHIMP_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params,
            mode: 'cors'
        });
        
        if (!response.ok) {
            throw new Error(`Server error: HTTP ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Increment counter
            subscriberCount++;
            updateSubscriberCount();
            
            // Reset form
            emailInput.value = '';
            
            // Show success message
            showNotification('Thank you for subscribing! Welcome to the Caffeine Cartel community!', 'success');
            
            // Add celebration animation
            celebrateSignup();
        } else {
            throw new Error(result.message || 'Subscription failed');
        }
        
    } catch (error) {
        console.error('Subscription error:', error);
        
        // Provide more helpful error messages
        let errorMessage = error.message;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (error.message.includes('CORS')) {
            errorMessage = 'Configuration error: Please ensure your Mailchimp API is properly configured with correct permissions.';
        } else if (error.message.includes('Mailchimp')) {
            errorMessage = 'Mailchimp error: Please check your Mailchimp configuration.';
        }
        
        showNotification(`Sorry, there was an error with your subscription: ${errorMessage}`, 'error');
    } finally {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #dc3545, #e76f51)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #007bff, #6610f2)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Celebration animation for new signup
function celebrateSignup() {
    const counter = subscriberCountElement;
    counter.style.animation = 'bounce 0.6s ease-in-out';
    
    // Create confetti effect
    createConfetti();
    
    setTimeout(() => {
        counter.style.animation = '';
    }, 600);
}

// Simple confetti effect
function createConfetti() {
    const colors = ['#f4a261', '#e76f51', '#2c1810', '#264653'];
    
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                top: ${Math.random() * 100}vh;
                left: ${Math.random() * 100}vw;
                animation: confettiFall 3s linear forwards;
                z-index: 999;
                border-radius: 50%;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 3000);
        }, i * 100);
    }
}

// Event listeners
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Clear search when input is empty
searchInput.addEventListener('input', function() {
    if (this.value.trim() === '') {
        clearSearch();
    }
});

newsletterForm.addEventListener('submit', handleNewsletterSignup);

// Contact form functionality
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmission);
}

function handleContactSubmission(e) {
    e.preventDefault();
    
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();
    const submitButton = contactForm.querySelector('.submit-btn');
    
    if (!email || !message) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Simulate form submission
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    submitButton.disabled = true;
    
    setTimeout(() => {
        // Reset form
        contactForm.reset();
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
        // Show success message
        showNotification('Message sent successfully! We\'ll get back to you soon.', 'success');
        
    }, 2000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes bounce {
        0%, 20%, 60%, 100% { transform: translateY(0); }
        40% { transform: translateY(-10px); }
        80% { transform: translateY(-5px); }
    }
    
    @keyframes confettiFall {
        0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
    }
    
    .blog-card, .featured-article {
        transition: all 0.3s ease;
    }
`;
document.head.appendChild(style);

// Category filtering functionality
function filterByCategory(category) {
    const blogCards = document.querySelectorAll('.blog-card');
    const featuredArticle = document.querySelector('.featured-article');
    let foundResults = 0;
    
    // Filter blog cards
    blogCards.forEach(card => {
        const cardCategory = card.querySelector('.category').textContent.trim();
        
        if (cardCategory === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeIn 0.5s ease-in';
            foundResults++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Filter featured article
    const featuredCategory = featuredArticle.querySelector('.category').textContent.trim();
    if (featuredCategory === category) {
        featuredArticle.style.display = 'block';
        foundResults++;
    } else {
        featuredArticle.style.display = 'none';
    }
    
    // Show filter message
    showSearchMessage(`Showing ${foundResults} post(s) in "${category}" category`);
    
    // Scroll to results
    document.querySelector('.main-content').scrollIntoView({
        behavior: 'smooth'
    });
}

// Add some interactive hover effects
document.addEventListener('DOMContentLoaded', function() {
    // Add parallax effect to featured image
    const featuredImage = document.querySelector('.featured-image img');
    if (featuredImage) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            featuredImage.style.transform = `translateY(${rate}px)`;
        });
    }
    
    // Add typing effect to search placeholder
    const searchInput = document.getElementById('searchInput');
    const placeholders = [
        'Search articles...',
        'Try "coffee machines"...',
        'Search "Colombian coffee"...',
        'Find "Cafes in Edinburgh"...'
    ];
    
    let currentPlaceholder = 0;
    
    setInterval(() => {
        currentPlaceholder = (currentPlaceholder + 1) % placeholders.length;
        searchInput.placeholder = placeholders[currentPlaceholder];
    }, 3000);
}());
