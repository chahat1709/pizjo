const fs = require('fs');

const localImages = [
    '../assets/pizza1.jpg',
    '../assets/pizza2.jpg',
    '../assets/pizza_hero.png',
    '../assets/hero_pizza_bg.png',
    '../assets/store_item.webp',
    '../assets/bahubali_pizza.png',
    '../assets/burger_and_fries.png',
    '../assets/burger_hero.png',
    '../assets/chocolate_waffle.png',
    '../assets/fries_side.png'
];

function randImg(category) {
    if (category.includes('Burger') || category.includes('Sandwich')) return localImages.filter(i => i.includes('burger'))[Math.floor(Math.random() * 2)];
    if (category.includes('Fries')) return '../assets/fries_side.png';
    if (category.includes('Dessert')) return '../assets/chocolate_waffle.png';
    if (category.includes('Pizza')) return localImages.filter(i => i.includes('pizza') || i.includes('store_item'))[Math.floor(Math.random() * 5)];
    return localImages[Math.floor(Math.random() * localImages.length)];
}

const categories = [
    { name: 'Classic Pizzas', basePrice: 120, items: ['Margherita', 'Double Cheese', 'Cheese & Corn', 'Tomato & Onion', 'Capsicum & Paneer', 'Fresh Veggie', 'Golden Corn', 'Spicy Onion', 'Veg Overload', 'Cheese Burst Classic'] },
    { name: 'Premium Pizzas', basePrice: 200, items: ['Peppy Paneer', 'Mexican Green Wave', 'Deluxe Veggie', 'Veg Extravaganza', 'Pizjo Special', 'Paneer Makhani', 'Indi Tandoori Paneer', 'Veggie Paradise', 'Farmhouse', 'Cloud 9'] },
    { name: 'Signature Pizzas', basePrice: 300, items: ['Bahubali Pizza (XXL)', 'Cheesy Volcano', 'The Underboss', 'Amraiwadi Mafia', 'Godfather Veggie', 'Ultimate Cheese Burst', 'Truffle Mushroom', 'Spicy Mexicana', 'Pesto Perfection', 'Chefs Special'] },
    { name: 'Jain Special Pizzas', basePrice: 180, items: ['Jain Margherita', 'Jain Corn & Cheese', 'Jain Veggie', 'Jain Paneer Special', 'Jain Spicy Tomato', 'Jain Farmhouse', 'Jain Supreme', 'Jain Peppy Paneer'] },
    { name: 'Garlic Breads', basePrice: 99, items: ['Classic Garlic Bread', 'Cheese Garlic Bread', 'Spicy Supreme Garlic Bread', 'Paneer Tikka Stuffed', 'Corn & Jalapeno Stuffed', 'Mushroom Stuffed', 'Cheese Burst Bread', 'Plain Stuffed Bread'] },
    { name: 'Momos', basePrice: 110, items: ['Steamed Veg Momos', 'Fried Veg Momos', 'Paneer Steamed Momos', 'Paneer Fried Momos', 'Kurkure Momos', 'Afghani Momos', 'Tandoori Momos', 'Cheese Corn Momos', 'Schezwan Momos', 'Chilli Momos'] },
    { name: 'Calizzas', basePrice: 150, items: ['Veggie Calizza', 'Paneer Tikka Calizza', 'Cheese Corn Calizza', 'Spicy Mexican Calizza', 'Italian Calizza', 'Mushroom Calizza', 'Tandoori Calizza'] },
    { name: 'Burgers', basePrice: 80, items: ['Aloo Tikki Burger', 'Veggie Burger', 'Cheese Burger', 'Paneer Burger', 'Spicy Paneer Burger', 'Double Decker Veg', 'Tandoori Burger', 'Maha Burger', 'Crispy Veg', 'Cheesy Jalapeno Burger'] },
    { name: 'Sandwiches', basePrice: 90, items: ['Bombay Grill', 'Cheese Chutney', 'Veg Club Sandwich', 'Paneer Tikka Sandwich', 'Corn & Spinach Sandwich', 'Coleslaw Sandwich', 'Tandoori Sandwich', 'Pizjo Special Sandwich'] },
    { name: 'Pasta', basePrice: 140, items: ['Red Sauce Pasta', 'White Sauce Pasta', 'Pink Sauce Pasta', 'Arrabbiata', 'Alfredo', 'Mac & Cheese', 'Pesto Pasta', 'Baked Cheesy Pasta', 'Spicy Desi Pasta'] },
    { name: 'Fries', basePrice: 70, items: ['Salted Fries', 'Peri Peri Fries', 'Cheesy Fries', 'Loaded Liquid Cheese Fries', 'Tandoori Fries', 'Jalapeno Cheese Fries', 'Spicy Wedges', 'Potato Tots'] },
    { name: 'Beverages', basePrice: 50, items: ['Cold Coffee', 'Thick Cold Coffee', 'Hazelnut Frappe', 'Classic Mojito', 'Green Apple Mojito', 'Watermelon Mojito', 'Blue Lagoon', 'Peach Iced Tea', 'Lemon Iced Tea', 'Oreo Shake', 'KitKat Shake', 'Strawberry Shake'] },
    { name: 'Combos', basePrice: 250, items: ['Solo Treat (1 Pizza + Beverage)', 'Couple Combo (2 Pizzas + Garlic Bread + 2 Beverages)', 'Family Feast (3 Pizzas + 2 Sides + 1 Ltr Coke)', 'Party Pack (5 Pizzas + 4 Sides)', 'Midnight Craving (1 Burger + Fries + Coke)'] },
    { name: 'Desserts', basePrice: 100, items: ['Choco Lava Cake', 'Brownie with Ice Cream', 'Chocolate Waffle', 'Nutella Waffle', 'Red Velvet Cake', 'Cheesecake Slice', 'Vanilla Ice Cream', 'Chocolate Mousse'] },
    { name: 'Dips & Extras', basePrice: 25, items: ['Cheese Dip', 'Jalapeno Dip', 'Tandoori Mayonnaise', 'Garlic Dip', 'Sweet Chilli Sauce', 'Extra Cheese', 'Extra Paneer', 'Extra Veggies'] }
];

const fullMenu = { categories: [] };
let itemCount = 0;

categories.forEach(cat => {
    const newCat = {
        name: cat.name,
        items: []
    };
    cat.items.forEach((item, idx) => {
        itemCount++;
        newCat.items.push({
            name: item,
            price: cat.basePrice + (idx * 10),
            description: `Delicious ${item} made fresh with 100% Amul cheese and premium ingredients.`,
            image: randImg(cat.name),
            veg: true
        });
    });
    fullMenu.categories.push(newCat);
});

console.log(`Generated ${itemCount} items across ${categories.length} categories.`);
fs.writeFileSync('data/menu.json', JSON.stringify(fullMenu, null, 2));
console.log('Successfully saved to data/menu.json');
