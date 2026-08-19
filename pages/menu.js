/**
 * pages/menu.js — Full menu renderer for Pizjo
 * Loads /data/menu.json, renders category sidebar + mobile tabs + item grid,
 * wires search and scroll-spy. Self-contained (no app.js dependency).
 */
(() => {
  'use strict';

  if (!window.PizjoSecurity) {
    console.error('[menu] window.PizjoSecurity missing — load js/security.js first');
    return;
  }
  const { escapeHTML } = window.PizjoSecurity;

  // Icon hint per category name. Pure-veg site, so icons are food-themed.
  const ICON_FOR = (name) => {
    const n = name.toLowerCase();
    if (n.includes('pizza')) return '🍕';
    if (n.includes('burger')) return '🍔';
    if (n.includes('momos')) return '🥟';
    if (n.includes('french') ||
      n.includes('fries')) return '🍟';
    if (n.includes('garlic')) return '🥖';
    if (n.includes('calzone')) return '🥙';
    if (n.includes('pasta')) return '🍝';
    if (n.includes('dessert') ||
      n.includes('brownie')) return '🍫';
    if (n.includes('cooler') ||
      n.includes('drink')) return '🥤';
    return '🍽️';
  };

  // Stable id-ification for menu category (used as anchor target).
  const slugify = (s) =>
    String(s).toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  // ── Data fetch (single source of truth) ──────────────────────────────
  let CATEGORIES = [];

  async function loadMenu() {
    if (!window.PizjoCatalog) throw new Error('shared catalog runtime missing');
    const catalog = await window.PizjoCatalog.load('../data/menu.json?v=2');
    await window.PizjoStorefrontSync?.hydrateCatalog(catalog);
    CATEGORIES = catalog.categories.map((category) => ({
      ...category,
      icon: ICON_FOR(category.name),
    }));
    window.PizjoMenuCatalog = catalog.items;
  }

  // ── Renderers ─────────────────────────────────────────────────────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function renderSidebar() {
    const sidebar = $('#sidebar-categories');
    const tabs = $('#menu-tabs-mobile');
    if (!sidebar || !tabs) return;

    sidebar.innerHTML = CATEGORIES.map((cat, i) => `
      <a href="#${cat.id}"
         class="sidebar-link ${i === 0 ? 'active' : ''}"
         data-cat="${cat.id}">
        <span class="sidebar-icon">${cat.icon}</span>
        <span class="sidebar-name">${escapeHTML(cat.name)}</span>
        <span class="sidebar-count">${cat.items.length}</span>
      </a>`).join('');

    tabs.innerHTML = CATEGORIES.map((cat, i) => `
      <button class="menu-tab ${i === 0 ? 'active' : ''}"
              data-cat="${cat.id}">${cat.icon} ${escapeHTML(cat.name)}</button>
    `).join('');
  }

  function renderSections(query = '') {
    const sectionsContainer = $('#menu-sections');
    const loadingEl = $('#menu-loading');
    const emptyEl = $('#menu-empty');
    if (!sectionsContainer || !loadingEl || !emptyEl) return;

    const q = query.toLowerCase().trim();
    const filtered = CATEGORIES.map((cat) => ({
      ...cat,
      items: q
        ? cat.items.filter((it) =>
          it.name.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q))
        : cat.items,
    })).filter((cat) => cat.items.length > 0);

    sectionsContainer.innerHTML = filtered.map((cat) => `
      <div class="menu-category-section" id="${cat.id}">
        <div class="menu-category-header">
          <span class="menu-category-icon">${cat.icon}</span>
          <h2 class="menu-category-title">${escapeHTML(cat.name)}</h2>
          <span class="menu-category-count">${cat.items.length} items</span>
        </div>
        <div class="menu-grid">
          ${cat.items.map((item) => `
            <article class="product-card${item.isAvailable === false ? ' is-unavailable' : ''}" data-id="${escapeHTML(item.id)}" data-name="${escapeHTML(item.name)}" data-price="${item.price}">
              <div class="product-badges">
                ${item.veg ? '<span class="badge badge-veg">Veg</span>' : ''}
                ${item.price > 200 ? '<span class="badge badge-bestseller">Bestseller</span>' : ''}
                ${item.isAvailable === false ? '<span class="badge badge-unavailable">Out of stock</span>' : ''}
              </div>
              <div class="product-info">
                <h3 class="product-title">${escapeHTML(item.name)}</h3>
                ${item.description ? `<p class="product-desc">${escapeHTML(item.description)}</p>` : ''}
              </div>
              ${item.image ? `
              <div class="product-image-container">
                <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="product-image" loading="lazy">
              </div>` : ''}
              <div class="product-footer">
                <span class="product-price">₹${item.price}</span>
                <button class="btn-add" data-id="${escapeHTML(item.id)}" data-price="${item.price}" type="button" ${item.isAvailable === false ? 'disabled aria-disabled="true" aria-label="' + escapeHTML(item.name) + ' is currently out of stock"' : 'aria-label="Add ' + escapeHTML(item.name) + ' to cart"'}>
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `).join('');

    loadingEl.style.display = 'none';
    emptyEl.style.display = filtered.length === 0 ? 'block' : 'none';

    // Announce to screen readers
    let announcer = document.getElementById('search-announcer');
    if (!announcer) {
      announcer = document.createElement('div');
      announcer.id = 'search-announcer';
      announcer.setAttribute('aria-live', 'polite');
      announcer.classList.add('sr-only');
      document.body.appendChild(announcer);
    }
    const resultCount = filtered.reduce((acc, cat) => acc + cat.items.length, 0);
    announcer.textContent = q ? `Found ${resultCount} items matching "${q}"` : '';
  }

  function wireNav() {
    const sidebar = $('#sidebar-categories');
    const tabs = $('#menu-tabs-mobile');
    sidebar?.addEventListener('click', (e) => {
      const link = e.target.closest('.sidebar-link');
      if (!link) return;
      e.preventDefault();
      sidebar.querySelectorAll('.sidebar-link').forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      const target = document.getElementById(link.dataset.cat);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    tabs?.addEventListener('click', (e) => {
      const tab = e.target.closest('.menu-tab');
      if (!tab) return;
      tabs.querySelectorAll('.menu-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.cat);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Scroll-spy
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        sidebar?.querySelectorAll('.sidebar-link').forEach((l) =>
          l.classList.toggle('active', l.dataset.cat === id));
        tabs?.querySelectorAll('.menu-tab').forEach((t) =>
          t.classList.toggle('active', t.dataset.cat === id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });

    requestAnimationFrame(() => {
      document.querySelectorAll('.menu-category-section').forEach((s) => observer.observe(s));
    });
  }

  function wireSearch() {
    const input = $('#menu-search');
    if (!input) return;
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => renderSections(input.value), 250);
    });
    $('#clear-search')?.addEventListener('click', () => {
      input.value = '';
      renderSections('');
    });
  }

  // ── Boot ──────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadMenu();
      renderSidebar();
      renderSections('');
      wireNav();
      wireSearch();
      
      // Wire global Add to Cart listener
      $('#menu-sections')?.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-add');
        if (!btn) return;
        if (typeof window.addToCart === 'function') {
          window.addToCart(btn.dataset.id, parseInt(btn.dataset.price, 10));
        } else {
          console.error('[menu] window.addToCart is not defined.');
        }
      });

      // Handle menu.html#pizza → scroll into that section after first render.
      if (window.location.hash) {
        const el = document.getElementById(window.location.hash.slice(1));
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err) {
      console.error('[menu] failed to initialise:', err);
      const loadingEl = $('#menu-loading');
      const emptyEl = $('#menu-empty');
      if (loadingEl) loadingEl.innerHTML = '<p class="error-state">Failed to load menu. Please refresh.</p>';
      if (emptyEl) emptyEl.style.display = 'block';
    }
  });
})();
