// ===== SHARED DATA =====
const products = Array.isArray(window.NOTICE_PRODUCTS) ? window.NOTICE_PRODUCTS : [];
const cartStorageKey = 'noticeCartItems';
let cartItems = readCart();

function readCart() {
    try {
        return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
    } catch (error) {
        console.error('Error reading cart: - main.js:10', error);
        return [];
    }
}

function saveCart() {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    updateCartCount();
}

function formatCurrency(amount) {
    return '₹' + Number(amount || 0).toLocaleString('en-IN');
}

function getProductImage(product) {
    if (product.image) {
        return `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
    }
    return `<div class="product-image" style="background: ${product.gradient || 'linear-gradient(135deg, #1A3A5C 0%, #FF6B35 100%)'}; display: flex; align-items: center; justify-content: center; height: 100%;"><i class="fas ${product.icon || 'fa-shirt'}" style="font-size: 3rem; color: rgba(255,255,255,0.3);"></i></div>`;
}

function renderStars(rating = 5) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            html += '<i class="fas fa-star"></i>';
        } else if (rating >= i - 0.5) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

// ===== MOBILE MENU TOGGLE =====
function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

// ===== SEARCH BAR TOGGLE =====
function initSearchBar() {
    const searchBtn = document.getElementById('searchBtn');
    const searchBar = document.getElementById('searchBar');

    if (searchBtn && searchBar) {
        searchBtn.addEventListener('click', () => {
            searchBar.classList.toggle('active');
        });
    }
}

// ===== PRODUCTS =====
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid || products.length === 0) {
        return;
    }

    productsGrid.innerHTML = products.map(product => `
        <article class="product-card" data-category="${product.category}" data-product-id="${product.id}">
            <div class="product-image-wrapper">
                ${getProductImage(product)}
                ${product.badge ? `<span class="badge badge-${product.badge.toLowerCase()}">${product.badge}</span>` : ''}
            </div>
            <h3>${product.name}</h3>
            <div class="stars">${renderStars(product.rating || 5)}</div>
            <p class="price">${formatCurrency(product.price)}</p>
            <button class="add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
        </article>
    `).join('');

    bindCartButtons();
    bindFilters();
    bindSearch();
    observeProductCards();
}

function findProduct(productId) {
    return products.find(product => product.id === productId);
}

function addToCart(productId) {
    const product = findProduct(productId);
    if (!product) {
        showToast('Product not found');
        return;
    }

    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cartItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    showToast('✓ Added to cart');
}

function bindCartButtons() {
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            addToCart(button.dataset.productId);
        });
    });
}

function updateCartCount() {
    const count = cartItems.reduce((total, item) => total + Number(item.quantity || 0), 0);
    document.querySelectorAll('.cart-count').forEach(element => {
        element.textContent = count;
    });
}

// ===== CART MODAL + BUY =====
function ensureCartModal() {
    if (document.getElementById('cartModal')) {
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'cart-modal';
    modal.id = 'cartModal';
    modal.innerHTML = `
        <div class="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cartTitle">
            <div class="cart-panel-header">
                <h2 id="cartTitle">Your Cart</h2>
                <button class="cart-close" id="cartClose" aria-label="Close cart"><i class="fas fa-times"></i></button>
            </div>
            <div class="cart-list" id="cartList"></div>
            <div class="cart-summary">
                <span>Total Amount</span>
                <strong id="cartTotal">₹0</strong>
            </div>
            <div class="cart-actions">
                <button class="cart-clear" id="cartClear">Clear</button>
                <button class="cart-buy" id="cartBuy"><i class="fab fa-whatsapp"></i> Buy Now</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cartClose').addEventListener('click', closeCart);
    document.getElementById('cartClear').addEventListener('click', () => {
        cartItems = [];
        saveCart();
        renderCart();
        showToast('✓ Cart cleared');
    });
    document.getElementById('cartBuy').addEventListener('click', buyCart);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeCart();
        }
    });
}

function openCart() {
    ensureCartModal();
    renderCart();
    document.getElementById('cartModal').classList.add('active');
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartList || !cartTotal) {
        return;
    }

    if (cartItems.length === 0) {
        cartList.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = formatCurrency(0);
        return;
    }

    cartList.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <div class="cart-thumb">${item.image ? `<img src="${item.image}" alt="${item.name}">` : '<i class="fas fa-shirt"></i>'}</div>
            <div>
                <h3>${item.name}</h3>
                <p>${formatCurrency(item.price)} x ${item.quantity}</p>
            </div>
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
        </div>
    `).join('');

    cartTotal.textContent = formatCurrency(getCartTotal());
}

function getCartTotal() {
    return cartItems.reduce((total, item) => total + Number(item.price || 0) * Number(item.quantity || 0), 0);
}

function buyCart() {
    if (cartItems.length === 0) {
        showToast('Please add products first');
        return;
    }

    const phoneNumber = "919998569395";
    let message = "Hello Notice Men's Wear, I want to buy:\n\n";

    cartItems.forEach(item => {
        message += `${item.name}\nQty: ${item.quantity}\nPrice: ₹${item.price}\nSubtotal: ₹${item.price * item.quantity}\n\n`;
    });

    message += `Total: ₹${getCartTotal()}`;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
}

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        background-color: #4CAF50;
        color: white;
        padding: 1rem 2rem;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===== ADD TOAST ANIMATIONS =====
function addToastAnimations() {
    if (document.getElementById('toastAnimations')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'toastAnimations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .product-card.is-visible {
            animation: fadeInUp 0.6s ease forwards;
        }
    `;
    document.head.appendChild(style);
}

// ===== CATEGORIES CAROUSEL =====
function initCategoriesCarousel() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const carousel = document.querySelector('.carousel');

    if (carousel && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: -260, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
            carousel.scrollBy({ left: 260, behavior: 'smooth' });
        });
    }
}

// ===== TESTIMONIALS AUTO SCROLL =====
function initTestimonials() {
    const dots = document.querySelectorAll('.dot');
    const testimonialsCarousel = document.querySelector('.testimonials-carousel');
    let testimonialIndex = 0;

    function goToTestimonial(index) {
        if (!testimonialsCarousel || dots.length === 0) {
            return;
        }

        testimonialIndex = index % dots.length;
        dots.forEach(dot => dot.classList.remove('active'));
        dots[testimonialIndex].classList.add('active');
        testimonialsCarousel.scrollTo({
            left: testimonialsCarousel.offsetWidth * testimonialIndex,
            behavior: 'smooth'
        });
    }

    if (dots.length > 0 && testimonialsCarousel) {
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                goToTestimonial(Number(dot.dataset.slide || 0));
            });
        });

        setInterval(() => {
            goToTestimonial(testimonialIndex + 1);
        }, 3500);
    }
}

// ===== FILTER FUNCTIONALITY =====
function bindFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

    if (filterButtons.length === 0) {
        return;
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterValue = button.getAttribute('data-filter');

            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            productCards.forEach(card => {
                const isVisible = filterValue === 'all' || card.getAttribute('data-category') === filterValue;
                card.style.display = isVisible ? 'block' : 'none';
                card.style.opacity = isVisible ? '1' : '0';
            });
        });
    });
}

// ===== SCROLL TO TOP BUTTON =====
function initScrollToTop() {
    const scrollToTopBtn = document.getElementById('scrollToTop');

    if (scrollToTopBtn) {
        window.addEventListener('scroll', () => {
            scrollToTopBtn.classList.toggle('show', window.pageYOffset > 300);
        });

        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// ===== FAQ ACCORDION =====
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                item.classList.toggle('active');
            });
        }
    });
}

// ===== NEWSLETTER FORM =====
function initNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', event => {
            event.preventDefault();
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            if (emailInput && emailInput.value) {
                showToast('✓ Subscribed successfully');
                newsletterForm.reset();
            }
        });
    }
}

// ===== SEARCH FUNCTIONALITY =====
function bindSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) {
        return;
    }

    searchInput.addEventListener('input', event => {
        const searchTerm = event.target.value.toLowerCase();
        document.querySelectorAll('.product-card').forEach(card => {
            const productName = card.querySelector('h3')?.textContent.toLowerCase() || '';
            card.style.display = productName.includes(searchTerm) ? 'block' : 'none';
        });
    });
}

// ===== SMOOTH SCROLL FOR ANCHOR LINKS =====
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                event.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// ===== ACTIVE NAV LINK =====
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === currentPage || (currentPage === '' && href === 'index.html'));
    });
}

// ===== PRODUCT CARD ANIMATION =====
function observeProductCards() {
    if (!('IntersectionObserver' in window)) {
        return;
    }

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.product-card').forEach(card => observer.observe(card));
}

// ===== FORM VALIDATION =====
function initFormValidation() {
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', event => {
            const inputs = form.querySelectorAll('input[required], textarea[required]');
            let isValid = true;

            inputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.style.borderColor = '#FF6B35';
                } else {
                    input.style.borderColor = '#E0E0E0';
                }
            });

            if (!isValid) {
                event.preventDefault();
                showToast('Please fill in all required fields');
            }
        });
    });
}

// ===== KEYBOARD SHORTCUTS =====
function initKeyboardShortcuts() {
    document.addEventListener('keydown', event => {
        if ((event.key === 's' || event.key === 'S') && !event.ctrlKey && !event.metaKey) {
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                event.preventDefault();
                searchInput.focus();
            }
        }
    });
}

// ===== CART ICON CLICK =====
function initCartButton() {
    const cartIcon = document.getElementById('cartBtn');
    if (cartIcon) {
        cartIcon.addEventListener('click', openCart);
    }
}

// ===== INITIALIZE ALL =====
function initializeApp() {
    addToastAnimations();
    initMobileMenu();
    initSearchBar();
    initCategoriesCarousel();
    initTestimonials();
    initScrollToTop();
    initFAQ();
    initNewsletter();
    initSmoothScroll();
    initFormValidation();
    initKeyboardShortcuts();
    initCartButton();
    setActiveNavLink();
    renderProducts();
    updateCartCount();
}

// ===== RUN ON PAGE LOAD =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}