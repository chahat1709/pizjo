import json
import random
import os

categories = {
    "Classic Pizzas (Regular 7\")": [
        ("Margherita", 120, "A classic delight with 100% real mozzarella cheese"),
        ("Double Cheese Margherita", 180, "The ever-popular Margherita - loaded with extra cheese... oodies of it!"),
        ("Cheese n Corn", 160, "Sweet & Juicy Golden corn and 100% real mozzarella cheese in a delectable combination !"),
        ("Cheese n Tomato", 160, "A delectable combination of cheese and juicy tomato"),
        ("Achari Do Pyaza", 160, "Tangy & spicy achari flavours on a super cheesy onion pizza"),
        ("Fresh Veggie", 200, "Delectable combination of onion & capsicum, a veggie lovers pick"),
        ("Peppy Paneer", 220, "Flavorful trio of juicy paneer, crisp capsicum with spicy red paprika"),
        ("Farmhouse", 220, "Delightful combination of onion, capsicum, tomato & grilled mushroom"),
        ("Veg Extravaganza", 250, "Black olives, capsicum, onion, grilled mushroom, corn, tomato, jalapeno & extra cheese"),
        ("Veggie Paradise", 220, "The awesome foursome! Golden corn, black olives, capsicum, red paprika")
    ],
    "Classic Pizzas (Medium 10\")": [],
    "Classic Pizzas (Large 13\")": [],
    "Premium Paneer Pizzas": [
        ("Tandoori Paneer", 250, "It is hot. It is spicy. It is oh-so-Indian. Tandoori paneer with capsicum, red paprika & mint mayo"),
        ("Makhani Paneer", 250, "A true Indian classic! Paneer tikka, onion, capsicum in a creamy makhani sauce"),
        ("Spicy Paneer", 250, "Spicy jalapenos, paneer, crisp capsicum and red paprika"),
        ("Paneer Onion", 220, "Simple yet delicious combination of paneer and crunchy onion")
    ],
    "Garlic Breads & Sides": [
        ("Garlic Breadsticks", 100, "Baked to perfection. Your perfect pizza partner! Tastes best with dip"),
        ("Stuffed Garlic Bread", 150, "Freshly Baked Garlic Bread stuffed with mozzarella cheese, sweet corn & tangy and spicy jalapeños"),
        ("Paneer Tikka Stuffed Garlic Bread", 170, "Freshly Baked Garlic Bread stuffed with paneer tikka, onion and cheese"),
        ("Cheesy Dip", 30, "A cheesy dip to make your garlic bread and pizza even more delicious"),
        ("Jalapeno Dip", 30, "A spicy jalapeno dip"),
        ("Potato Wedges", 110, "Crispy golden baked potato wedges"),
        ("French Fries", 100, "Crispy golden french fries"),
        ("Peri Peri Fries", 120, "Crispy fries tossed in spicy peri peri seasoning")
    ],
    "Pasta": [
        ("Veg Macaroni", 140, "Macaroni tossed in a creamy cheese sauce with veggies"),
        ("Red Sauce Pasta", 150, "Penne pasta in a tangy tomato and herb sauce"),
        ("White Sauce Pasta", 160, "Penne pasta in a creamy, cheesy white sauce with mushrooms and corn"),
        ("Mix Sauce Pasta", 170, "The best of both worlds - creamy and tangy mix sauce pasta")
    ],
    "Burgers & Sandwiches": [
        ("Aloo Tikki Burger", 70, "Crispy aloo patty with fresh veggies and creamy mayo"),
        ("Veggie Burger", 90, "Mixed veg patty with lettuce, tomato, onion and cheese slice"),
        ("Paneer Burger", 120, "Spicy paneer patty with crisp lettuce and mayo"),
        ("Bombay Sandwich", 100, "Classic 3-layer sandwich with mint chutney, veggies and cheese"),
        ("Grilled Cheese Sandwich", 120, "Oozing with 3 types of cheese, grilled to perfection")
    ],
    "Beverages": [
        ("Cold Coffee", 120, "Classic creamy cold coffee"),
        ("Frappe", 140, "Thick, blended iced coffee"),
        ("Oreo Shake", 150, "Thick shake blended with crunchy Oreo cookies"),
        ("KitKat Shake", 150, "Thick shake blended with KitKat chocolate"),
        ("Virgin Mojito", 110, "Refreshing mix of mint, lemon and soda"),
        ("Blue Lagoon", 110, "Tropical blue curacao with lime and soda"),
        ("Coke (330ml)", 60, "Chilled Coca Cola can"),
        ("Sprite (330ml)", 60, "Chilled Sprite can")
    ],
    "Desserts": [
        ("Choco Lava Cake", 100, "Chocolate lovers delight! Indulgent, gooey molten lava inside chocolate cake"),
        ("Brownie", 90, "Fudgy chocolate brownie"),
        ("Brownie with Ice Cream", 140, "Warm brownie topped with vanilla ice cream and chocolate sauce"),
        ("Red Velvet Lava Cake", 120, "A sweet twist to our classic lava cake")
    ]
}

# Auto-generate Medium and Large variations with higher prices
for item in categories["Classic Pizzas (Regular 7\")"]:
    name, price, desc = item
    categories["Classic Pizzas (Medium 10\")"].append((name, int(price * 1.8), desc))
    categories["Classic Pizzas (Large 13\")"].append((name, int(price * 2.5), desc))

final_data = {"categories": []}
for cat_name, items in categories.items():
    cat_items = []
    for name, price, desc in items:
        cat_items.append({
            "name": name,
            "price": price,
            "description": desc,
            "image": f"https://source.unsplash.com/400x300/?{name.replace(' ', ',')},food" # Placeholder if needed
        })
    final_data["categories"].append({"name": cat_name, "items": cat_items})

os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'data'), exist_ok=True)
with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'menu.json'), 'w', encoding='utf-8') as f:
    json.dump(final_data, f, indent=4)
    
print("Generated menu.json successfully!")
