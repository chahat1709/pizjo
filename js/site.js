// Shared public-site hydration for business links and accessible navigation.
(function (global) {
  'use strict';
  const config = global.PizjoConfig;
  if (!config) return;

  function hydrateBusinessLinks(root = document) {
    root.querySelectorAll('[data-whatsapp-link]').forEach((link) => {
      const message = link.getAttribute('data-whatsapp-message') || '';
      link.setAttribute('href', config.whatsappUrl(message));
    });
    root.querySelectorAll('[data-phone-link]').forEach((link) => {
      link.setAttribute('href', config.telUrl());
      if (link.hasAttribute('data-phone-text')) {
        // Display as "+91 92653 70588" instead of the raw "+919265370588" dial string.
        const digits = String(config.whatsappNumber || '');
        link.textContent = digits.length === 12
          ? `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`
          : `+${digits}`;
      }
    });
    root.querySelectorAll('[data-business-name]').forEach((el) => {
      el.textContent = config.businessName;
    });
  }

  function bindWhatsAppForms() {
    document.querySelectorAll('form[data-whatsapp-form]').forEach((form) => {
      if (form.dataset.bound === 'true') return;
      form.dataset.bound = 'true';
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(form);
        const email = String(data.get('email') || '').trim();
        const message = form.getAttribute('data-whatsapp-message') || `Hi! I would like to contact ${config.businessName}.`;
        const suffix = email ? `\nEmail: ${email}` : '';
        window.open(config.whatsappUrl(`${message}${suffix}`), '_blank', 'noopener,noreferrer');
      });
    });
  }

  function bindMobileMenu() {
    const toggle = document.getElementById('mobile-menu-toggle');
    const links = document.querySelector('.nav-links');
    if (!toggle || !links || toggle.dataset.bound === 'true') return;
    toggle.dataset.bound = 'true';
    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    links.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
  }

  function init() {
    hydrateBusinessLinks();
    bindWhatsAppForms();
    bindMobileMenu();
  }

  global.PizjoSite = Object.freeze({ hydrateBusinessLinks, bindMobileMenu, init });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})(window);
