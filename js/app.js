import { initThreeHero } from './three-hero.js?v=7';

// 1. Initialize 3D Hero
initThreeHero('three-canvas-container');

// 2. State Management
    let menuData = [];
    let currentCategory = '';
    let cart = {}; // { itemName: { price, quantity, name } }

    const DOM = {
        grid: document.getElementById('menu-grid'),
        filter: document.getElementById('categories-filter'),
        cartToggle: document.getElementById('cart-toggle'),
        cartClose: document.getElementById('cart-close'),
        cartSidebar: document.getElementById('cart-sidebar'),
        cartOverlay: document.getElementById('cart-overlay'),
        cartItems: document.getElementById('cart-items'),
        cartCount: document.getElementById('cart-count'),
        cartTotal: document.getElementById('cart-total'),
        checkoutBtn: document.getElementById('checkout-btn')
    };

    // 3. Load Data
    async function loadMenu() {
        try {
            const res = await fetch('data/menu.json?v=' + Date.now());
            if (!res.ok) throw new Error('Failed to load menu');
            
            const data = await res.json();
            menuData = data.categories || [];
            
            if (menuData.length > 0) {
                currentCategory = menuData[0].name;
                renderFilters();
                renderGrid();
            }
        } catch (error) {
            console.error('Error loading menu:', error);
            DOM.grid.innerHTML = `<p class="error">Failed to load menu. Please try again later.</p>`;
            DOM.filter.innerHTML = '';
        }
    }

    // 4. Render
    function renderFilters() {
        DOM.filter.innerHTML = menuData.map(cat => `
            <button class="cat-btn ${cat.name === currentCategory ? 'active' : ''}" data-cat="${cat.name}">
                ${window.PizjoSecurity.sanitizeHTML(cat.name)}
            </button>
        `).join('');

        DOM.filter.querySelectorAll('.cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                DOM.filter.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.getAttribute('data-cat');
                renderGrid();
            });
        });
    }

    function renderGrid() {
        const cat = menuData.find(c => c.name === currentCategory);
        if (!cat) return;

        // Reset animation state
        DOM.grid.style.opacity = '0';
        DOM.grid.style.transform = 'translateY(10px)';

        setTimeout(() => {
            DOM.grid.innerHTML = cat.items.map(item => `
                <div class="product-card">
                    <div class="product-info">
                        <div class="product-badges">
                            ${item.name.toLowerCase().includes('veg') || item.name.toLowerCase().includes('paneer') || item.name.toLowerCase().includes('margherita') ? '<span class="badge badge-veg">Veg</span>' : ''}
                            ${item.price > 200 ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
                        </div>
                        <h3 class="product-title">${window.PizjoSecurity.sanitizeHTML(item.name)}</h3>
                        <span class="product-price">₹${item.price}</span>
                        <p class="product-desc">${window.PizjoSecurity.sanitizeHTML(item.description || '')}</p>
                    </div>
                    <div class="product-image-container">
                        ${item.image ? `<img src="${window.PizjoSecurity.sanitizeHTML(item.image)}" alt="${window.PizjoSecurity.sanitizeHTML(item.name)}" class="product-image" loading="lazy">` : ''}
                        <button class="btn-add" data-name="${window.PizjoSecurity.sanitizeHTML(item.name)}" data-price="${item.price}">
                            ADD
                        </button>
                    </div>
                </div>
            `).join('');

            // Re-bind add buttons
            DOM.grid.querySelectorAll('.btn-add').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const price = parseInt(e.target.getAttribute('data-price'));
                    addToCart(name, price);
                });
            });

            // Fade in
            requestAnimationFrame(() => {
                DOM.grid.style.transition = 'all 0.4s var(--ease-out)';
                DOM.grid.style.opacity = '1';
                DOM.grid.style.transform = 'translateY(0)';
            });
        }, 150);
    }

    // 5. Cart Logic
    function addToCart(name, price) {
        if (cart[name]) {
            cart[name].qty++;
        } else {
            cart[name] = { name, price, qty: 1 };
        }
        updateCartUI();
        openCart();
    }

    function updateCartQty(name, delta) {
        if (!cart[name]) return;
        cart[name].qty += delta;
        if (cart[name].qty <= 0) {
            delete cart[name];
        }
        updateCartUI();
    }

    function updateCartUI() {
        let totalItems = 0;
        let totalPrice = 0;
        const itemsHTML = [];

        Object.values(cart).forEach(item => {
            totalItems += item.qty;
            totalPrice += item.price * item.qty;
            itemsHTML.push(`
                <div class="cart-item">
                    <div>
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-price">₹${item.price}</div>
                    </div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" data-name="${item.name}" data-action="minus">-</button>
                        <span class="qty-val">${item.qty}</span>
                        <button class="qty-btn" data-name="${item.name}" data-action="plus">+</button>
                    </div>
                </div>
            `);
        });

        DOM.cartCount.innerText = totalItems;
        DOM.cartTotal.innerText = `₹${totalPrice}`;

        if (itemsHTML.length === 0) {
            DOM.cartItems.innerHTML = `
                <div class="cart-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                    <p>Your cart is looking a little empty.</p>
                </div>
            `;
        } else {
            DOM.cartItems.innerHTML = itemsHTML.join('');
            // Bind qty buttons
            DOM.cartItems.querySelectorAll('.qty-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const name = e.target.getAttribute('data-name');
                    const action = e.target.getAttribute('data-action');
                    updateCartQty(name, action === 'plus' ? 1 : -1);
                });
            });
        }
    }

    function openCart() {
        DOM.cartSidebar.classList.add('open');
        DOM.cartOverlay.classList.add('open');
    }
    
    function closeCart() {
        DOM.cartSidebar.classList.remove('open');
        DOM.cartOverlay.classList.remove('open');
    }

    DOM.cartToggle.addEventListener('click', openCart);
    DOM.cartClose.addEventListener('click', closeCart);
    DOM.cartOverlay.addEventListener('click', closeCart);

    // 6. Checkout
    DOM.checkoutBtn.addEventListener('click', () => {
        const items = Object.values(cart);
        if (items.length === 0) return;

        // Security check - calculate total server-side style
        let total = 0;
        let orderText = "Hello Pizjo! I'd like to place an order:%0a%0a";
        
        items.forEach(item => {
            total += item.price * item.qty;
            orderText += `*${item.qty}x ${item.name}* (₹${item.price * item.qty})%0a`;
        });
        
        orderText += `%0a*Total: ₹${total}*%0a%0aPlease confirm my order.`;
        
        // Pizjo WhatsApp Number
        const whatsappNumber = "919999999999"; 
        window.open(`https://wa.me/${whatsappNumber}?text=${orderText}`, "_blank");
    });

// Start
loadMenu();
