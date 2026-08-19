// ============================================
// PIZJO — Security Module
// XSS prevention, CSP, rate limiting, validation
// ============================================

window.PizjoSecurity = (() => {
    'use strict';

    // ── HTML Entity Escaping (XSS Prevention) ──
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    function sanitizeHTML(str) {
        if (typeof str !== 'string') return String(str);
        return str.replace(/[&<>"']/g, c => escapeMap[c]);
    }

    // ── Rate Limiter (debounce rapid actions) ──
    const rateLimits = new Map();
    function rateLimit(key, cooldownMs = 300) {
        const now = Date.now();
        const last = rateLimits.get(key) || 0;
        if (now - last < cooldownMs) return false;
        rateLimits.set(key, now);
        return true;
    }

    // ── Cart Price Integrity Check ──
    function validatePrice(itemKey, claimedPrice, menuData) {
        if (!Array.isArray(menuData)) return false;
        for (const cat of menuData) {
            for (const item of (cat.items || [])) {
                const key = item.id || item.name;
                if (key === itemKey) return Number(item.price) === Number(claimedPrice);
            }
        }
        return false;
    }

    // ── Sanitize External Links ──
    function hardenExternalLinks() {
        document.querySelectorAll('a[target="_blank"]').forEach(link => {
            const rel = (link.getAttribute('rel') || '').split(/\s+/);
            if (!rel.includes('noopener')) rel.push('noopener');
            if (!rel.includes('noreferrer')) rel.push('noreferrer');
            link.setAttribute('rel', rel.filter(Boolean).join(' '));
        });
    }

    // ── Form Validation Helpers ──
    const validators = {
        email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        phone: v => /^[+]?[\d\s()-]{7,15}$/.test(v),
        name: v => typeof v === 'string' && v.trim().length >= 2 && v.trim().length <= 100,
        message: v => typeof v === 'string' && v.trim().length >= 5 && v.trim().length <= 2000,
    };

    // ── Max Cart Quantity Guard ──
    const MAX_ITEM_QTY = 20;
    const MAX_CART_ITEMS = 50;

    function canAddToCart(cartItems, itemKey) {
        if (!Array.isArray(cartItems)) return { ok: false, reason: 'Cart data is invalid' };
        const existing = cartItems.find(i => (i.id || i.name) === itemKey);
        if (existing && Number(existing.qty) >= MAX_ITEM_QTY) {
            return { ok: false, reason: `Max ${MAX_ITEM_QTY} per item` };
        }
        if (!existing && cartItems.length >= MAX_CART_ITEMS) {
            return { ok: false, reason: `Cart is full (max ${MAX_CART_ITEMS} different items)` };
        }
        return { ok: true };
    }

    function normalizeCart(raw, catalog = []) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        const source = raw.version && raw.items && typeof raw.items === 'object' ? raw.items : raw;
        const byId = new Map(catalog.filter(Boolean).map((item) => [String(item.id), item]));
        const byName = new Map(catalog.filter(Boolean).map((item) => [String(item.name).trim(), item]));
        return Object.values(source).reduce((cart, item) => {
            if (!item || typeof item !== 'object') return cart;
            const candidate = byId.get(String(item.id || '')) || byName.get(String(item.name || '').trim());
            if (!candidate) return cart;
            const qty = Math.floor(Number(item.qty));
            if (!Number.isFinite(qty) || qty < 1) return cart;
            const id = String(candidate.id);
            const safeQty = Math.min(qty, MAX_ITEM_QTY);
            if (Object.keys(cart).length < MAX_CART_ITEMS) {
                cart[id] = {
                    id,
                    name: String(candidate.name).trim().slice(0, 200),
                    price: Number(candidate.price),
                    qty: safeQty,
                };
            }
            return cart;
        }, {});
    }

    // ── Init: Run on page load ──
    function init() {
        hardenExternalLinks();
        // Re-run after dynamic content injection
        const observer = new MutationObserver(() => hardenExternalLinks());
        observer.observe(document.body, { childList: true, subtree: true });
    }

    return {
        sanitizeHTML,
        escapeHTML: sanitizeHTML,
        rateLimit,
        validatePrice,
        hardenExternalLinks,
        validators,
        canAddToCart,
        normalizeCart,
        MAX_ITEM_QTY,
        MAX_CART_ITEMS,
        init,
    };
})();
