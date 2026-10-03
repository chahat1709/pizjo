// scripts/build-real-menu.js — regenerate data/menu.json from the real Pizjo menu.
//
// Provenance: extracted from the live Swiggy listing for Pizjo (Vastral,
// Ahmedabad) on 2026-10-03. 178 listed items; the Swiggy-generated
// "Recommended" section (20 items) is a mix of items that all exist in their
// real categories below, so it is intentionally skipped: 158 unique items
// across 17 categories. Names, prices, descriptions and spellings are the
// owner's own — do not "fix" them. One within-category duplicate name pair
// (Veg Darjeeling momos, garlic vs plain variant) is two distinct items.
//
// Usage: node scripts/build-real-menu.js   (run from repo root or scripts/)

'use strict';

const fs = require('fs');
const path = require('path');

const img = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;

// Reused from the previous placeholder menu — swap for real cafe photos later.
const POOL = {
  pizza: [
    '1628840042765-356cda07504e',
    '1574071318508-1cdbab80d002',
    '1571997478779-2adcbbe9ab2f',
    '1604382354936-07c5d9983bd3',
    '1565299624946-b28f40a0ae38',
    '1613564834361-9436948817d1',
    '1513104890138-7c749659a591',
    '1594007654729-407eedc4be65',
    '1555072956-7758afb20e8f',
  ].map(img),
  burger: [
    '1568901346375-23c9450c58cd',
    '1530554764233-e79e16c91d08',
    '1551782450-a2132b4ba21d',
    '1633424234673-c8cd0f4df77b',
    '1713330801172-03f8d1c0dde7',
    '1549611016-3a70d82b5040',
    '1565299507177-b0ac66763828',
    '1603064752734-4c48eff53d05',
    '1610440042657-612c34d95e9f',
    '1572802419224-296b0aeee0d9',
    '1625813506062-0aeb1d7a094b',
    '1571066811602-716837d681de',
  ].map(img),
  momo: [
    '1626322751504-930506dd41ca',
    '1541696432-82c6da8ce7bf',
    '1563245372-f21724e3856d',
    '1589047133481-02b4a5327d89',
    '1638502338747-f7f368214cce',
    '1638502521795-89107ac5e246',
  ].map(img),
  fries: [
    '1573080496219-bb080dd4f877',
    '1615485290836-4ebcebf44aaf',
    '1598679253544-2c97992403ea',
    '1661081090290-9b66fd49d882',
    '1606755456206-b25206cde27e',
    '1607329773021-91a5dbd5986f',
    '1541592106381-b31e9677c0e5',
  ].map(img),
  garlic: [
    '1676976198546-18595f0796f0',
    '1593527270723-834c53a3fed4',
    '1707886114218-fb2bcfbcb1e7',
    '1558679582-7fe9071024c9',
  ].map(img),
  waffle: [
    '1512056068661-14ef8b6bfabe',
    '1613483515012-8879be29b578',
  ].map(img),
  drinks: [
    '1533007716222-4b465613a984',
    '1621221814951-fa755dd0c993',
    '1592663527359-cf6642f54cff',
    '1559496417-e7f25cb247f3',
    '1589985902809-39d25db22101',
    '1641659736749-8bbae305e475',
    '1551538827-9c037cb4f32a',
    '1576615278693-f8e095e37e01',
  ].map(img),
};

// [name, price, description, bestseller?]
const MENU = [
  {
    id: 'newly-launched-pizza', name: 'Newly Launched Pizza', pool: 'pizza',
    items: [
      ["Paneer Spice Supreme", 189, "Feel the flavor burst: spicy sauce & gravy, green chilly, capsicum, onion, tomato, olives, jelapenos, red-peprika, gravy marinated paneer"],
      ["Pizjo Retreat", 216, "Make your own. . !!!"],
      ["Fresh Veggie", 189, "Crunch into freshness: bell-paper, capsicum, onion, tomato, green olives, jelapenos, brocolie, black-olives"],
      ["Veg Extravaganza", 202.5, ""],
      ["Deluxe Veggie", 202.5, "Indulge in deluxe flavors: peri-peri & chipotle base, bell paper, red-peprika, green olives, jelapenos, black-olives, mushroom, onion, gravy marinated paneer"],
      ["Veggie Paradise", 202.5, ""],
      ["Fire-fused Paneer Crust (Hot & Spicy)", 202.5, "Paneer perfection meets a fiery touch!, bell-paper, onion, capsicum, schezwan marinated paneer"],
      ["Farm House (Pizjo Sp.)", 202.5, "Experience homegrown goodness: peri-peri & gravy base, small chopped capsicum, onion, tomato, paneer & corn"],
      ["Cheesy Heaven Pie (Veggie-cheesy)", 202.5, "A cheesy slice of heaven on earth!, bell-paper, onion, red-peprika, green-olives, brocolie, gravy paneer."],
      ["The Cheese Dominator (Cheesiest One)", 202.5, "Prepare for a cheesy takeover: cheese blend, 100% mozzrella, chhedar cheese, cheese spread dip, filler cheese"],
      ["Bahubali Pizza", 649, ""],
    ],
  },
  {
    id: 'signature-pizza', name: 'Signature Pizza', pool: 'pizza',
    items: [
      ["Peri-peri Paneer (Chef Sp.)", 175.5, "Feel the fire: peri-peri base, capsicum, onion, bell-paper, jelapenos & peri-peri marinated paneer"],
      ["Spicy Vegitarian Feast (Spiciest One)", 175.5, "Kick up the heat with our spicy veg. Feast: spicy base, green-chilly, capsicum, onion, corn, mushroom, jelapenos & black-olives"],
      ["Lava Layers (Best For Spicy Lovers)", 175.5, "Hot, cheesy, and unforgettable!, tomato, red-peprika, red capsicum, green-olives."],
      ["Bbq Paneer", 175.5, "Sizzle and delight: bbq & pizza sauce, capsicum, onion, red capsicum, black olives, green olives, bbq & gravy marinated paneer"],
      ["Paneer Butter Masala", 175.5, "A fusion of spice and comfort: buttery gravy base, onion, tomato, jelapenos & gravy marinated paneer"],
      ["Veg Loaded", 175.5, "Overflowing with freshness and flavor: capsicum, onion, tomato, jelapenos & black olives"],
      ["Garden Glory", 175.5, "Pure freshness, pure glory!, capsicum, green-olives, jelapenos, brocolie, basil-leaves."],
      ["Veg Tandoori", 175.5, "Tandoori magic on a crust!, capsicum, onion, black-olives, green-olives."],
      ["Veg Delight", 175.5, "Savor the veggie goodness: capsicum, onion, mushroom, corn & marinated paneer"],
      ["Veggie Fiesta", 175.5, "Freshness and flavor in every bite!, capsicum, corn, red-peprika"],
      ["Paneer Tikka (Bestseller)", 175.5, "Experience the sizzle: makhni gravy base, capsisum, onion, tomato & gravy marinated paneer", true],
      ["Kadhai Paneer", 175.5, "Kadhai magic on a pizza!, capsicum, tomato, red-peprika, gravy marinated paneer."],
      ["Paneer Delight", 175.5, "A paneer lover's dream come true!, onion, red-peprika, mixed gravy & peri-peri paneer"],
    ],
  },
  {
    id: 'value-pizza', name: 'Value Pizza', pool: 'pizza',
    items: [
      ["Barbeque Margerita", 121.5, "Sizzle with every bite: barbeque-infused margherita delight!"],
      ["Margherita", 108, "Savor the simplicity: margherita magic 100% amul mozzrella"],
      ["Dragon's Fury Margherita (Hot & Spicy)", 135, "Where spice meets double cheese margherita in a fiery fusion of flavor!"],
      ["Schezwan Margerita", 121.5, "Spice up your slice: schezwan twist on classic margherita"],
      ["Peri-peri Margerita", 121.5, "Heat up your taste buds: peri-peri meets margherita perfection"],
      ["Triple Tango", 162, "Triple the flavor, triple the fun: dive into our triple tango pizza sensation!"],
      ["Mushroon & Corn", 162, "A marriage of earthy and sweet: corn and mushroom pizza, a delightful harmony of flavors!"],
      ["Paneer & Red Peprika", 162, "Satisfy your cravings with every bite: paneer and red pepper pizza, a burst of flavor in every slice!"],
      ["Jelapenos, Sweet Corn & Paneer", 162, "Fiery, sweet, and creamy: jalapenos, sweet corn, and paneer pizza, a flavor-packed sensation!"],
      ["Jelapenos & Olives", 162, "Spice meets brine: jalapenos and olives pizza, a zesty mediterranean delight!"],
      ["Capsicum & Paneer", 162, "Savor the spice, relish the richness: capsicum and paneer pizza, a tantalizing taste adventure"],
      ["Onion & Capsicum", 148.5, "Vibrant flavors unite: onion and capsicum pizza, a colorful culinary symphony!"],
      ["Golden Corn", 135, "Fresh, juicy, and simply delicious: tomato pizza love at first bite!"],
      ["Fresh Tomato", 135, "Fresh, juicy, and simply delicious: tomato pizza love at first bite!"],
      ["Onion & Paneer", 162, "A marriage of sweetness and richness: onion and paneer pizza, a perfect balance of flavors!"],
      ["Tandoori Margerita", 121.5, "Flavors of india meet classic margherita: tandoori twist on pizza perfection!"],
      ["Crispy Onion", 135, "Tangy sweetness, savory perfection: onion pizza bliss!"],
      ["Green Capsicum", 135, "Colorful crunch in every slice: capsicum pizza perfection!"],
      ["Double Cheese Margerita", 135, "Indulge in cheesy bliss: double the delight, margherita perfection"],
      ["Margherita Combo Offer", 129, "2 margrita pizza"],
    ],
  },
  {
    id: 'pocket-calzone', name: 'Pocket Calzone', pool: 'pizza',
    items: [
      ["Paneer Tikka Calzone", 175.5, ""],
      ["Cheese Calzone", 121.5, ""],
      ["Chipotle Calzone", 135, ""],
      ["Onion & Corn Calzone", 148.5, ""],
      ["Veggie Stuffed Calzone", 162, ""],
      ["Peri-peri Calzone", 175.5, ""],
      ["Maxican Calzone", 189, ""],
      ["Bbq Paneer Calzone", 189, ""],
    ],
  },
  {
    id: 'calizza', name: 'Calizza', pool: 'pizza',
    items: [
      ["Exotic Veg & Peri-peri Paneer Calizza", 525.15, ""],
      ["Paneer Tikka & Peri-peri Paneer Calizza", 538.65, ""],
      ["Exotic Veg & Bbq Paneer Calizza", 525.15, ""],
      ["Make Your Own Calizza", 673.65, ""],
      ["Peri-peri Paneer & Bbq Calizza", 538.65, ""],
      ["Exotic Veg & Pesto Paneer Pizza", 606.15, ""],
      ["Pesto Paneer & Peri-peri Calizza", 633.15, ""],
      ["Veg & Paneer Tikka Calizza", 525.15, ""],
      ["Veggi & Mushroom Delight Calizza", 444.15, ""],
      ["Spicy Veggie Maxican", 403.65, ""],
      ["Cheese & Exotic Veg Calizza", 403.65, ""],
      ["Classic Cheese Calizza", 283.5, ""],
      ["Cheese Corn & Jalepenos Corn Calizza", 322.65, ""],
      ["Cheese & Veggi Calizza", 349.65, ""],
      ["Quattro Formaggi Calizza", 403.65, ""],
    ],
  },
  {
    id: 'offer-combo', name: 'Offer Combo', pool: 'pizza',
    items: [
      ["Special Combo (Reg Pizza+ Burger+ Coke)", 159, "Special combo for food lovers.", true],
      ["Cheese Calizza + Normal Veg Clizza Combo", 538.65, ""],
      ["Margerita Regular + Capsicum Regular + Onion Regular + Spicy Paneer", 444.15, ""],
      ["Margerita R, Capsicum R, Onion R, tomato Regular", 444.15, ""],
      ["Paneer Tikka Regular + Supreme Veggie Garlic Bread + Coke", 322.65, ""],
      ["Peri-peri Paneer Regular + Veg & Corn Garlic Bread + Coke", 309.15, ""],
      ["Spicy Veg. Feast Regular + Vanilla Shake", 295.65, ""],
      ["Capsicum & Paneer Regular + Corn & Cheese Garlic Bread + Coke", 268.65, ""],
      ["Veg Loaded Regular + Cheese Garlic Bread + Coke", 255.15, ""],
      ["Golden Corn Regular + Cheese Garlic Bread + Coke", 228.15, ""],
      ["Margerita Regular + Cheese Garlic Bread + Coke", 214.65, ""],
      ["Margerita Regular + Plain Garlic Bread + Coke", 187.65, ""],
      ["Veg. Single Combo Pizza", 349, "Onion,capsicum,tomoto,corn"],
      ["New Combo", 299, "Margherita r + spicy paneer+ choco lava cake"],
    ],
  },
  {
    id: 'stuffed-garlic-breads', name: 'Stuffed Garlic Breads', pool: 'garlic',
    items: [
      ["Peri-peri Paneer Garlic Bread", 175.5, ""],
      ["Corn & Cheese Garlic Bread", 121.5, "", true],
      ["Paneer Tikka Garlic Bread", 189, ""],
      ["Supreme Veggie Garlic Bread", 148.5, ""],
      ["Plain Garlic Bread", 81, "", true],
      ["Cheese Stuffed Garlic Bread", 108, ""],
      ["Cheesy Schezwan Garlic Bread", 108, ""],
      ["Veggie & Corn Garlic Bread", 162, ""],
      ["Corn, Jelapenos & Cheese Garlic Bread", 135, ""],
      ["Corn & Paneer Garlic Bread", 135, ""],
      ["Chilly Cheese Garlic Bread", 135, ""],
      ["Cheesy Maxican Garlic Bread", 148.5, ""],
      ["Veggie Stuffed Garlic Bread", 148.5, ""],
    ],
  },
  {
    id: 'french-fries', name: 'French Fries', pool: 'fries',
    items: [
      ["Salted Fries", 106.65, ""],
      ["Veg Cheesy Jelapenos Peri-peri Fries", 243, ""],
      ["Veg Cheesy Peri-peri Fries", 229.5, ""],
      ["Cheesy Peri-peri Fries", 202.5, ""],
      ["Cheesy Salted Fries", 175.5, ""],
      ["Peri-peri Fries", 148.5, ""],
    ],
  },
  {
    id: 'burger-bite', name: 'Burger Bite', pool: 'burger',
    items: [
      ["Spicy Tangy Aloo Tikki", 121.5, ""],
      ["Keto Burger (Protein Packed Bliss)", 175.5, ""],
      ["Classic Double Patty", 121.5, ""],
      ["Veggie Double Patty", 135, ""],
      ["Veg Cheese", 148.5, ""],
      ["Cheesy Peri-peri", 148.5, ""],
      ["Corn & Cheese", 148.5, ""],
      ["Maxican Patty", 162, ""],
      ["Maxican Double Patty", 175.5, ""],
      ["Crispy Veg", 108, ""],
      ["Classic Aloo Tikki", 94.5, ""],
      ["Crunchy Burger Combo", 129, "2 classic aaloo tikki burger"],
    ],
  },
  {
    id: 'momo-burgers', name: 'Momo Burgers', pool: 'momo',
    items: [
      ["Paneer Momo Burger", 133.65, ""],
      ["Paneer Tikka Momo Burger", 133.65, ""],
      ["Corn Cheese Momo Burger", 133.65, ""],
      ["Mix Veg Momo Burger", 120.15, ""],
      ["Spicy Veg Momo Burger", 120.15, ""],
      ["Veg Cheese Momo Burger", 133.65, ""],
    ],
  },
  {
    id: 'sandwitches', name: 'Sandwitches', pool: 'burger',
    items: [
      ["Bahubali Sandwich", 649, "paneer, 3 types of souce (mexican, tandoori, chipotle), loaded cheese, veggie"],
      ["Cheese Chilly Sandwich", 155, "lodead cheese with souce"],
      ["Paneer Tikka Sandwich", 194, "paneer with tikka gravy, 3 slice"],
      ["Veg Club Sandwich", 194, "all veggies and green sauce, 3 slice"],
    ],
  },
  {
    id: 'momos-6-pcs', name: 'Momos (6 Pcs)', pool: 'momo',
    items: [
      ["Corn & Cheese Deep Fried Peri-peri Momo", 189, ""],
      ["Spicy Veg Deep Fried Garlic Peri-peri Momo", 175.5, ""],
      ["Himalayan Paneer Deep Fried Peri-peri Momo", 175.5, ""],
      ["Veg Darjeeling Deep Fried Garlic Peri-peri Momo", 162, ""],
      ["Veg Darjeeling Deep Fried Peri-peri Momo", 162, ""],
      ["Spicy Veg Momos", 108, ""],
      ["Cheese Corn Momos", 148.5, ""],
      ["Paneer Tikka Momos", 148.5, ""],
      ["Veg Cheese Momos", 148.5, "", true],
      ["Paneer Momos", 135, ""],
      ["Mix Veg Momos", 94.5, "", true],
    ],
  },
  {
    id: 'pastas', name: 'Pastas', pool: null,
    items: [
      ["Alfredo Pasta", 194, ""],
      ["Arrabbiata Pasta", 194, ""],
      ["Pesto Pasta", 194, ""],
      ["Pink Sauce Pasta", 194, ""],
      ["Creamy Mushroom Gravy Pasta", 220, ""],
    ],
  },
  {
    id: 'delicious-slides', name: 'Delicious Slides', pool: 'garlic',
    items: [
      ["Zingy Parcel", 64, "", true],
      ["Garlic (Cheese) Bread", 142, ""],
      ["Veg Pocket", 168, ""],
    ],
  },
  {
    id: 'lava-cakes', name: 'Lava Cakes', pool: 'waffle',
    items: [
      ["Lava Cake", 103, ""],
      ["Choco Lava Cake", 129, ""],
      ["Nutella Lava Cake", 129, ""],
    ],
  },
  {
    id: 'waffle-and-brownie', name: 'Waffle And Brownie', pool: 'waffle',
    items: [
      ["Chocolate Waffle", 133.65, ""],
      ["Brownie With Ice Cream", 162, ""],
      ["Vanilla Ice Cream", 52.65, ""],
      ["Crunchy Waffle", 133.65, ""],
      ["Sizzling Brownie With Ice Cream", 174.15, ""],
    ],
  },
  {
    id: 'coolers-250ml', name: 'Coolers (250ml)', pool: 'drinks',
    items: [
      ["Vanilla Shake", 133.65, ""],
      ["Virjin Mojito", 148.5, ""],
      ["Lemon Ice Tea", 93.15, ""],
      ["Peach Iced Tea", 106.65, ""],
      ["Classic Cold Coffee", 159, ""],
      ["Chocolate Cold Coffee", 133.65, ""],
      ["Chocolate Shake", 148.5, ""],
      ["Kitkat Shake", 148.5, ""],
      ["Oreo Brownie Shake", 174.15, ""],
    ],
  },
];

const slugify = (value) => String(value)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/(^-|-$)/g, '');

const categories = MENU.map((cat) => {
  const categoryId = cat.id || slugify(cat.name);
  const pool = cat.pool ? POOL[cat.pool] : [];
  const items = cat.items.map(([name, price, description, b], index) => {
    const item = {
      name,
      price,
      veg: true,
      id: `${categoryId}-${slugify(name)}`,
    };
    if (description) item.description = description;
    if (pool.length) item.image = pool[index % pool.length];
    if (b) item.b = true;
    return item;
  });
  return { name: cat.name, id: categoryId, items };
});

// Validation — mirrors js/catalog.js normalize() guarantees.
const seen = new Set();
let count = 0;
for (const category of categories) {
  if (seen.has(category.id)) throw new Error(`Duplicate category id: ${category.id}`);
  seen.add(category.id);
  for (const item of category.items) {
    if (seen.has(item.id)) throw new Error(`Duplicate catalog item id: ${item.id}`);
    seen.add(item.id);
    if (!Number.isFinite(item.price) || item.price < 0) throw new Error(`Invalid price for: ${item.name}`);
    count++;
  }
}
const prices = categories.flatMap((c) => c.items.map((i) => i.price));
const bestsellers = categories.flatMap((c) => c.items.filter((i) => i.b).map((i) => i.name));

const outPath = path.join(__dirname, '..', 'data', 'menu.json');
fs.writeFileSync(outPath, JSON.stringify({ categories }, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
console.log(`categories=${categories.length} items=${count} bestsellers=${bestsellers.length}`);
console.log(`price range: ${Math.min(...prices)} – ${Math.max(...prices)}`);
console.log('bestsellers:', bestsellers.join(' | '));
