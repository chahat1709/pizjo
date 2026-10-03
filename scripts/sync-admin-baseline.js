// Sync admin/shared/pizjo-menu-catalog.json from data/menu.json (single source of truth).
// Keeps the cloud admin baseline identical to the storefront catalog.
// Usage: node scripts/sync-admin-baseline.js   (run from repo root)
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const menu = JSON.parse(fs.readFileSync(path.join(root, 'data', 'menu.json'), 'utf8'));

const categories = (menu.categories || []).map((cat) => ({
  name: String(cat.name),
  items: (cat.items || []).map((item) => ({
    id: String(item.id),
    name: String(item.name),
    price: Number(item.price),
    description: String(item.description || ''),
    image: String(item.image || ''),
    veg: item.veg !== false,
  })),
}));

const ids = categories.flatMap((c) => c.items.map((i) => i.id));
if (ids.some((id) => !id)) throw new Error('every item requires an id');
if (new Set(ids).size !== ids.length) throw new Error('item IDs must be unique');

fs.writeFileSync(
  path.join(root, 'admin', 'shared', 'pizjo-menu-catalog.json'),
  JSON.stringify({ categories }, null, 2) + '\n',
);

const count = categories.reduce((n, c) => n + c.items.length, 0);
console.log(`admin baseline synced: ${categories.length} categories, ${count} items`);
