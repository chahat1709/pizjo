import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = [
  'index.html',
  '404.html',
  ...fs.readdirSync(path.join(root, 'pages'))
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.join('pages', file)),
];

const failures = [];
for (const relative of htmlFiles) {
  const filePath = path.join(root, relative);
  const html = fs.readFileSync(filePath, 'utf8');
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${relative}: missing title`);
  if (!/<meta[^>]+Content-Security-Policy/i.test(html)) failures.push(`${relative}: missing CSP`);
  if (!/<\/html>\s*$/i.test(html)) failures.push(`${relative}: missing closing html tag`);
  if (/919265370588/.test(html)) failures.push(`${relative}: hardcoded WhatsApp number must use shared configuration`);
  if (/setAttribute\(['"]aria-expanded['"],\s*isOpen\)/.test(html)) failures.push(`${relative}: aria-expanded must receive a string`);
}

const requiredFiles = [
  'js/config.js',
  'js/catalog.js',
  'js/site.js',
  'js/security.js',
  'js/app.js',
  'js/admin-storefront-sync.js',
  'api/order-summary.js',
  'data/menu.json',
  'sw/service-worker.js',
  'vercel.json',
];
for (const relative of requiredFiles) {
  if (!fs.existsSync(path.join(root, relative))) failures.push(`${relative}: missing required file`);
}

const menu = JSON.parse(fs.readFileSync(path.join(root, 'data/menu.json'), 'utf8'));
const ids = (menu.categories || []).flatMap((category) => (category.items || []).map((item) => item.id));
if (ids.some((id) => typeof id !== 'string' || !id.trim())) failures.push('data/menu.json: every item requires a stable id');
if (new Set(ids).size !== ids.length) failures.push('data/menu.json: item IDs must be unique');

const deployment = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headerKeys = deployment.headers?.flatMap((entry) => entry.headers || []).map((header) => header.key) || [];
if (!headerKeys.includes('Content-Security-Policy')) failures.push('vercel.json: missing Content-Security-Policy response header');
const csp = deployment.headers?.flatMap((entry) => entry.headers || []).find((header) => header.key === 'Content-Security-Policy')?.value || '';
const adminOrigin = 'https://pizjoadmin-9mxbkqqm.manus.space';
if (!csp.includes(adminOrigin)) failures.push('vercel.json: CSP must allow the published Pizjo Admin origin for customer-facing feeds');

const config = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
if (!config.includes(`adminBaseUrl: '${adminOrigin}'`)) failures.push('js/config.js: missing published Pizjo Admin base URL');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
if (!home.includes('id="live-offers"') || !home.includes('js/admin-storefront-sync.js')) failures.push('index.html: missing live offers integration');
const fullMenu = fs.readFileSync(path.join(root, 'pages/menu.html'), 'utf8');
if (!fullMenu.includes('admin-storefront-sync.js')) failures.push('pages/menu.html: missing admin availability integration');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`Validated ${htmlFiles.length} HTML pages, ${requiredFiles.length} required project files, and ${ids.length} unique menu IDs.`);
