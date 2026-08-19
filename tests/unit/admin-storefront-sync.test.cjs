const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../../js/admin-storefront-sync.js'), 'utf8');

function loadSync(fetchImpl) {
  const sandbox = {
    fetch: fetchImpl,
    window: {
      location: { hostname: 'pizjo.vercel.app' },
      PizjoConfig: {
        adminBaseUrl: 'https://pizjoadmin-9mxbkqqm.manus.space',
        adminStorefrontHosts: ['pizjo.vercel.app'],
      },
      PizjoSecurity: { escapeHTML: (value) => String(value).replace(/[&<>"']/g, '') },
    },
  };
  vm.runInNewContext(source, sandbox, { filename: 'admin-storefront-sync.js' });
  return sandbox.window.PizjoStorefrontSync;
}

test('applies published availability states by stable catalog ID', async () => {
  const sync = loadSync(async () => ({ ok: true, json: async () => ({ items: [
    { catalogId: 'pizza-margherita', isAvailable: false },
    { catalogId: 'pizza-paneer', isAvailable: true },
  ] }) }));
  const catalog = {
    items: [{ id: 'pizza-margherita' }, { id: 'pizza-paneer' }, { id: 'burger-veg' }],
    categories: [{ items: [{ id: 'pizza-margherita' }, { id: 'pizza-paneer' }, { id: 'burger-veg' }] }],
  };

  await sync.hydrateCatalog(catalog);

  assert.equal(catalog.items[0].isAvailable, false);
  assert.equal(catalog.items[1].isAvailable, true);
  assert.equal(catalog.items[2].isAvailable, undefined);
  assert.equal(catalog.categories[0].items[0].isAvailable, false);
});

test('retains the local catalog when the published admin feed is unavailable', async () => {
  const sync = loadSync(async () => { throw new Error('network unavailable'); });
  const catalog = { items: [{ id: 'pizza-margherita', isAvailable: true }], categories: [] };

  await sync.hydrateCatalog(catalog);

  assert.equal(catalog.items[0].isAvailable, true);
});
