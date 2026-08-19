// Shared catalog loader and normalization contract.
(function (global) {
  'use strict';

  const slugify = (value) => String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  function normalize(data) {
    if (!data || !Array.isArray(data.categories)) {
      throw new Error('Catalog data is missing categories');
    }

    const ids = new Set();
    const categories = data.categories.map((category) => {
      const categoryId = String(category.id || slugify(category.name));
      const items = Array.isArray(category.items) ? category.items.map((item, index) => {
        const id = String(item.id || `${categoryId}-${slugify(item.name)}-${index + 1}`);
        if (ids.has(id)) throw new Error(`Duplicate catalog item id: ${id}`);
        ids.add(id);
        const price = Number(item.price);
        if (!Number.isFinite(price) || price < 0) throw new Error(`Invalid price for catalog item: ${id}`);
        return Object.freeze({
          id,
          name: String(item.name || '').trim(),
          price,
          description: String(item.description || ''),
          image: String(item.image || ''),
          veg: item.veg !== false,
          categoryId,
        });
      }) : [];

      return Object.freeze({
        id: categoryId,
        name: String(category.name || '').trim(),
        items: Object.freeze(items),
      });
    });

    return Object.freeze({
      categories: Object.freeze(categories),
      items: Object.freeze(categories.flatMap((category) => category.items)),
    });
  }

  async function load(url = 'data/menu.json?v=2') {
    const response = await fetch(url, { credentials: 'same-origin' });
    if (!response.ok) throw new Error(`menu.json HTTP ${response.status}`);
    const catalog = normalize(await response.json());
    global.PizjoMenuCatalog = catalog.items;
    global.PizjoMenuCategories = catalog.categories;
    return catalog;
  }

  function findById(catalog, id) {
    return (catalog?.items || []).find((item) => item.id === id) || null;
  }

  global.PizjoCatalog = Object.freeze({ slugify, normalize, load, findById });
})(window);
