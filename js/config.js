// Shared runtime configuration for the static storefront.
// Keep public business configuration in one place so every page stays consistent.
window.PizjoConfig = Object.freeze({
  whatsappNumber: '919265370588',
  businessName: 'Pizjo',
  currency: '₹',
  maxItemQuantity: 20,
  maxCartEntries: 50,
  menuUrl: 'data/menu.json?v=2',
  // TEMP: Manus origin restored until admin cutover is deployed.
  // At cutover, switch to 'https://pizjo-admin.vercel.app' (+ vercel.json CSP
  // + validator origin) per admin/docs/vercel-neon-migration.md step 3.
  adminBaseUrl: 'https://pizjoadmin-9mxbkqqm.manus.space',
  adminStorefrontHosts: ['pizjo.vercel.app'],
  telemetryConsentKey: 'pizjoTelemetryConsent',
  whatsappUrl(message = '') {
    const base = `https://wa.me/${this.whatsappNumber}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  },
  telUrl() {
    return `tel:+${this.whatsappNumber}`;
  },
});
