// Shared runtime configuration for the static storefront.
// Keep public business configuration in one place so every page stays consistent.
window.PizjoConfig = Object.freeze({
  whatsappNumber: '919265370588',
  businessName: 'Pizjo',
  currency: '₹',
  maxItemQuantity: 20,
  maxCartEntries: 50,
  menuUrl: 'data/menu.json?v=2',
  // Self-hosted admin (Vercel + Neon migration). Rename if your admin
  // Vercel project uses a different domain, then redeploy the storefront.
  adminBaseUrl: 'https://pizjo-admin.vercel.app',
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
