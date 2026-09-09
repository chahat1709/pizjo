import fs from 'node:fs';

const file = new URL('../data/menu.json', import.meta.url);
const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const seen = new Set();

for (const category of data.categories || []) {
  const categoryId = slug(category.name);
  for (const item of category.items || []) {
    const existing = item.id || `${categoryId}-${slug(item.name)}`;
    let id = existing;
    let suffix = 2;
    while (seen.has(id)) id = `${existing}-${suffix++}`;
    item.id = id;
    seen.add(id);
  }
}

fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Assigned ${seen.size} stable menu IDs.`);
