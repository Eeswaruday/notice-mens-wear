// ===== SHARED DATA =====
const products = Array.isArray(window.NOTICE_PRODUCTS) ? window.NOTICE_PRODUCTS : [];
const cartStorageKey = 'noticeCartItems';
let cartItems = readCart();

function readCart() {
    try {
        return JSON.parse(localStorage.getItem(cartStorageKey)) || [];
    } catch (error) {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(cartStorageKey, JSON.stringify(cartItems));
    updateCartCount();
}

function formatCurrency(amount) {
    return '\u20b9' + Number(amount || 0).toLocaleString('en-IN');
}

function getProductImage(product) {
    if (product.image) {
        return `<img src="${product.image}" alt="${product.name}" loading="lazy">`;
    }

    return `<div class="product-image" style="background: ${product.gradient || 'linear-gradient(135deg, #1A3A5C 0%, #FF6B35 100%)'};"><i class="fas ${product.icon || 'fa-shirt'}"></i></div>`;
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

// ===== SEARCH BAR TOGGLE =====
const searchBtn = document.getElementById('searchBtn');
const searchBar = document.getElementById('searchBar');

if (searchBtn && searchBar) {
    searchBtn.addEventListener('click', () => {
        searchBar.classList.toggle('active');
    });
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
            <div class="stars">${renderStars(product.rating)}</div>
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
    showToast('Added to cart');
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
                <strong id="cartTotal">\u20b90</strong>
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
    document.getElementById('cartModal')?.classList.remove('active');
}

function renderCart() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    if (!cartList || !cartTotal) {
        return;
    }

    if (cartItems.length === 0) {
        cartList.innerHTML = '<p class="empty-cart">Cart is empty.</p>';
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

    const lines = cartItems.map(item => {
        const imageText = item.image ? `\nImage: ${new URL(item.image, window.location.href).href}` : '';
        return `${item.name}\nQty: ${item.quantity}\nPrice: ${formatCurrency(item.price)}\nSubtotal: ${formatCurrency(item.price * item.quantity)}${imageText}`;
    });
    const message = `Hello Notice Men's Wear, I want to buy:\n\n${lines.join('\n\n')}\n\nTotal: ${formatCurrency(getCartTotal())}`;
    const phoneNumber = "919998569395";

let message = "Hello Notice Men's Wear, I want to buy:\n\n";

cartItems.forEach(item => {
    message += `${item.name} Qty: ${item.quantity} Price: ₹${item.price}\n`;
});

message += `\nTotal: ₹${getCartTotal()}`;

const whatsappUrl =
`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

window.open(whatsappUrl, "_blank");
}

document.querySelectorAll('#cartBtn').forEach(button => {
    button.addEventListener('click', openCart);
});

// ===== TOAST NOTIFICATION =====
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ===== CATEGORIES CAROUSEL =====
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

// ===== TESTIMONIALS AUTO SCROLL =====
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

// ===== FILTER FUNCTIONALITY =====
function bindFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const productCards = document.querySelectorAll('.product-card');

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
const scrollToTopBtn = document.getElementById('scrollToTop');

if (scrollToTopBtn) {
    window.addEventListener('scroll', () => {
        scrollToTopBtn.classList.toggle('show', window.pageYOffset > 300);
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-item').forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
        question.addEventListener('click', () => {
            document.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    }
});

// ===== NEWSLETTER FORM =====
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
    newsletterForm.addEventListener('submit', event => {
        event.preventDefault();
        if (newsletterForm.querySelector('input[type="email"]').value) {
            showToast('Subscribed successfully');
            newsletterForm.reset();
        }
    });
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
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (event) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

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

document.addEventListener('keydown', event => {
    if (event.key === 's' || event.key === 'S') {
        document.getElementById('searchInput')?.focus();
    }
});

setActiveNavLink();
renderProducts();
if (!document.getElementById('productsGrid')) {
    bindSearch();
}
updateCartCount();
