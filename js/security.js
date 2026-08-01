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
    function validatePrice(itemId, claimedPrice, menuData) {
        if (!menuData || !Array.isArray(menuData)) return true; // Skip if no source
        for (const cat of menuData) {
            for (const sub of (cat.subcategories || [])) {
                const found = (sub.items || []).find(i => i.id === itemId);
                if (found) return found.price === claimedPrice;
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

    function canAddToCart(cartItems, itemId) {
        if (cartItems.length >= MAX_CART_ITEMS) return { ok: false, reason: 'Cart is full (max 50 items)' };
        const existing = cartItems.find(i => i.id === itemId);
        if (existing && existing.qty >= MAX_ITEM_QTY) return { ok: false, reason: `Max ${MAX_ITEM_QTY} per item` };
        return { ok: true };
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
        MAX_ITEM_QTY,
        MAX_CART_ITEMS,
        init,
    };
})();
