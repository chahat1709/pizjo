const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createDataStore } = require('../data-store.cjs');

function createFixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pizjo-desktop-'));
  const menuPath = path.join(__dirname, '..', 'data', 'menu.json');
  const store = createDataStore({ databasePath: path.join(directory, 'pizjo.db'), menuPath });
  return { directory, store };
}

test('owner setup creates an authenticated administrator and durable seeded catalog', () => {
  const { store } = createFixture();
  assert.equal(store.bootstrap().needsSetup, true);
  const session = store.setupOwner({ username: 'owner.pizjo', displayName: 'Pizjo Owner', password: 'safe-local-password' });
  assert.equal(store.bootstrap().needsSetup, false);
  const state = store.getState({ token: session.token });
  assert.equal(state.user.role, 'admin');
  assert.equal(state.menu.length, 81);
  store.close();
});

test('staff account cannot alter availability while the owner can', () => {
  const { store } = createFixture();
  const owner = store.setupOwner({ username: 'owner', displayName: 'Owner', password: 'safe-local-password' });
  store.perform({ token: owner.token }, { type: 'save-staff', payload: { username: 'counter', displayName: 'Counter Staff', password: 'safe-local-password', role: 'staff' } });
  const staff = store.signIn({ username: 'counter', password: 'safe-local-password' });
  const itemId = store.getState({ token: owner.token }).menu[0].id;
  assert.throws(() => store.perform({ token: staff.token }, { type: 'availability', payload: { id: itemId, available: false } }), /Administrator access/);
  store.perform({ token: owner.token }, { type: 'availability', payload: { id: itemId, available: false } });
  assert.equal(store.getState({ token: owner.token }).menu.find(item => item.id === itemId).available, false);
  store.close();
});

test('local order deducts available stock and supports a unique invoice', () => {
  const { store } = createFixture();
  const owner = store.setupOwner({ username: 'owner', displayName: 'Owner', password: 'safe-local-password' });
  const item = store.getState({ token: owner.token }).menu[0];
  store.perform({ token: owner.token }, { type: 'stock-adjust', payload: { id: item.id, change: 8, threshold: 2 } });
  const order = store.perform({ token: owner.token }, { type: 'create-order', payload: { source: 'Walk-in', items: [{ id: item.id, qty: 2 }] } });
  assert.equal(order.total, item.price * 2);
  assert.equal(store.getState({ token: owner.token }).menu.find(row => row.id === item.id).stock, 6);
  const invoice = store.perform({ token: owner.token }, { type: 'create-invoice', payload: { orderId: order.id } });
  assert.match(invoice.number, /^PZ-00001$/);
  assert.throws(() => store.perform({ token: owner.token }, { type: 'create-invoice', payload: { orderId: order.id } }), /already exists/);
  store.close();
});

test('backup creates an independent database copy', () => {
  const { directory, store } = createFixture();
  const owner = store.setupOwner({ username: 'owner', displayName: 'Owner', password: 'safe-local-password' });
  const backupPath = path.join(directory, 'backup.db');
  store.backupTo(backupPath);
  assert.equal(fs.existsSync(backupPath), true);
  assert.ok(fs.statSync(backupPath).size > 0);
  assert.equal(store.getState({ token: owner.token }).user.username, 'owner');
  store.close();
});

test('restore replaces later local records with the selected backup', () => {
  const { directory, store } = createFixture();
  const owner = store.setupOwner({ username: 'owner', displayName: 'Owner', password: 'safe-local-password' });
  const backupPath = path.join(directory, 'baseline.db');
  store.backupTo(backupPath);
  store.perform({ token: owner.token }, { type: 'save-offer', payload: { title: 'Later offer', offerType: 'percentage', value: 10, status: 'draft' } });
  assert.equal(store.getState({ token: owner.token }).offers.length, 1);
  store.restoreFrom(backupPath);
  const restored = createDataStore({ databasePath: path.join(directory, 'pizjo.db'), menuPath: path.join(__dirname, '..', 'data', 'menu.json') });
  const restoredOwner = restored.signIn({ username: 'owner', password: 'safe-local-password' });
  assert.equal(restored.getState({ token: restoredOwner.token }).offers.length, 0);
  restored.close();
});

test('administrators can create and update local social-account records', () => {
  const { store } = createFixture();
  const owner = store.setupOwner({ username: 'owner', displayName: 'Owner', password: 'safe-local-password' });
  store.perform({ token: owner.token }, { type: 'save-social', payload: { platform: 'Instagram', handle: '@pizjo', url: 'https://instagram.example/pizjo' } });
  const created = store.getState({ token: owner.token }).socialAccounts.find(account => account.handle === '@pizjo');
  assert.ok(created);
  store.perform({ token: owner.token }, { type: 'save-social', payload: { id: created.id, platform: 'Instagram', handle: '@pizjo.india', url: 'https://instagram.example/pizjo-india' } });
  const updated = store.getState({ token: owner.token }).socialAccounts.find(account => account.id === created.id);
  assert.equal(updated.handle, '@pizjo.india');
  store.close();
});

test('desktop renderer and main process contain no remote web endpoints', () => {
  const root = path.join(__dirname, '..');
  const mainAndPreload = ['main.cjs', 'preload.cjs'].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  const renderer = [path.join('renderer', 'app.js'), path.join('renderer', 'index.html')].map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  assert.equal(/https?:\/\//i.test(mainAndPreload), false);
  assert.equal(/\bfetch\s*\(/.test(`${mainAndPreload}\n${renderer}`), false);
});
