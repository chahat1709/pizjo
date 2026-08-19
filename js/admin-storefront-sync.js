// Published Pizjo Admin feed integration.
// The static storefront remains usable when the admin service is unavailable.
(() => {
  'use strict';

  const config = window.PizjoConfig || {};
  const allowedHosts = Array.isArray(config.adminStorefrontHosts) ? config.adminStorefrontHosts : [];
  const enabled = Boolean(config.adminBaseUrl) && allowedHosts.includes(window.location.hostname);
  const availabilityUrl = enabled ? `${String(config.adminBaseUrl).replace(/\/$/, '')}/api/storefront/availability` : '';
  const offersUrl = enabled ? `${String(config.adminBaseUrl).replace(/\/$/, '')}/api/storefront/offers` : '';
  let availabilityPromise;
  let offersPromise;

  const escapeHTML = (value) => window.PizjoSecurity?.escapeHTML
    ? window.PizjoSecurity.escapeHTML(String(value ?? ''))
    : String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  async function requestJSON(url, fallback) {
    if (!url) return fallback;
    try {
      const response = await fetch(url, { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) return fallback;
      return await response.json();
    } catch {
      return fallback;
    }
  }

  function availability() {
    availabilityPromise ||= requestJSON(availabilityUrl, { items: [] });
    return availabilityPromise;
  }

  function offers() {
    offersPromise ||= requestJSON(offersUrl, { offers: [] });
    return offersPromise;
  }

  async function hydrateCatalog(catalog) {
    if (!catalog?.items?.length) return catalog;
    const payload = await availability();
    const states = new Map((payload.items || []).map(item => [item.catalogId, item.isAvailable !== false]));
    if (!states.size) return catalog;
    catalog.items.forEach(item => {
      if (states.has(item.id)) item.isAvailable = states.get(item.id);
    });
    (catalog.categories || []).forEach(category => {
      (category.items || []).forEach(item => {
        if (states.has(item.id)) item.isAvailable = states.get(item.id);
      });
    });
    return catalog;
  }

  function offerValue(offer) {
    if (offer.discountType === 'percentage') return `${Number(offer.discountValue || 0) / 100}% OFF`;
    if (offer.discountType === 'fixed') return `₹${Math.round(Number(offer.discountValue || 0) / 100)} OFF`;
    if (offer.discountType === 'bogo') return 'BOGO';
    return 'FREE ITEM';
  }

  function offerMessage(offer) {
    const code = offer.promoCode ? ` using code ${offer.promoCode}` : '';
    return `Hi Pizjo! I want to claim the ${offer.title}${code}.`;
  }

  async function renderOffers() {
    const root = document.getElementById('live-offers');
    if (!root) return;
    const payload = await offers();
    const activeOffers = Array.isArray(payload.offers) ? payload.offers.slice(0, 3) : [];
    if (!activeOffers.length) {
      root.innerHTML = '<p class="live-offers-empty">No live deals right now. Keep an eye here — fresh steals can land anytime.</p>';
      return;
    }
    root.innerHTML = activeOffers.map((offer, index) => {
      const dark = index % 2 === 1;
      const cardClass = dark ? 'live-offer-card live-offer-card-dark' : 'live-offer-card card-grunge';
      const action = config.whatsappUrl ? config.whatsappUrl(offerMessage(offer)) : '#';
      const conditions = [
        offer.promoCode ? `Code: ${offer.promoCode}` : '',
        Number(offer.minimumOrderPaise || 0) ? `Min. order ₹${Math.round(Number(offer.minimumOrderPaise) / 100)}` : '',
      ].filter(Boolean).join(' · ');
      return `<article class="${cardClass}">
        <span class="badge live-offer-badge">${escapeHTML(offer.displayLabel || offerValue(offer))}</span>
        <div class="live-offer-copy">
          <p class="live-offer-value">${escapeHTML(offerValue(offer))}</p>
          <h3>${escapeHTML(offer.title)}</h3>
          <p>${escapeHTML(offer.description || 'A freshly prepared Pizjo deal, available while this campaign is live.')}</p>
          ${conditions ? `<p class="live-offer-conditions">${escapeHTML(conditions)}</p>` : ''}
          ${offer.terms ? `<p class="live-offer-terms">${escapeHTML(offer.terms)}</p>` : ''}
          <a href="${escapeHTML(action)}" target="_blank" rel="noopener noreferrer" class="btn ${dark ? 'live-offer-dark-action' : 'btn-primary'}">Claim Deal</a>
        </div>
      </article>`;
    }).join('');
  }

  window.PizjoStorefrontSync = Object.freeze({ hydrateCatalog, renderOffers, availability, offers });
})();
