import json

menu_data = {
    "categories": [
        {
            "name": "Single Pizza Combos",
            "items": [
                {
                    "name": "Pick 1: Margherita Combo",
                    "price": 139,
                    "description": "Margherita Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 2: Margherita Cheese Combo",
                    "price": 159,
                    "description": "Margherita Regular + Cheese Garlic Bread + Coke",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 3: Golden Corn Combo",
                    "price": 169,
                    "description": "Golden Corn Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/pizza2.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 4: Veg Loaded Combo",
                    "price": 189,
                    "description": "Veg Loaded Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/pizza2.jpg",
                    "veg": True
                }
            ]
        },
        {
            "name": "Premium Pizza Combos",
            "items": [
                {
                    "name": "Pick 5: Capsicum & Paneer Combo",
                    "price": 199,
                    "description": "Capsicum & Paneer Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 6: Spicy Veg Feast & Shake",
                    "price": 219,
                    "description": "Spicy Veg. Feast Regular + Stuffed Garlic Bread + Vanilla Shake",
                    "image": "assets/pizza_hero.png",
                    "veg": True
                },
                {
                    "name": "Pick 7: Peri-Peri Paneer Combo",
                    "price": 229,
                    "description": "Peri-Peri Paneer Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/hero_pizza_bg.png",
                    "veg": True
                },
                {
                    "name": "Pick 8: Paneer Tikka Combo",
                    "price": 239,
                    "description": "Paneer Tikka Regular + Stuffed Garlic Bread + Coke",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                }
            ]
        },
        {
            "name": "Double Pizza & Calzone Combos",
            "items": [
                {
                    "name": "Pick 9: Twin Margherita & Capsicum",
                    "price": 329,
                    "description": "Margherita Regular + Capsicum Regular + Stuffed Garlic Bread + 2 Coke",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 10: 4-Topping Pizza Feast",
                    "price": 329,
                    "description": "Margherita Regular + Capsicum Regular + Onion Regular + Tomato Regular",
                    "image": "assets/pizza2.jpg",
                    "veg": True
                },
                {
                    "name": "Pick 11: Extravaganza Double Combo",
                    "price": 379,
                    "description": "Veg Extravaganza Regular + Double Cheese Margherita + Stuffed Garlic Bread + 2 Coke",
                    "image": "assets/pizza_hero.png",
                    "veg": True
                },
                {
                    "name": "Pick 12: Calzone Mega Combo",
                    "price": 399,
                    "description": "Cheese Calizza + Normal Veg Calizza (Any 2) + Stuffed Garlic Bread + 2 Coke",
                    "image": "assets/bahubali_pizza.png",
                    "veg": True
                }
            ]
        },
        {
            "name": "Special Offers",
            "items": [
                {
                    "name": "BOGO Margherita (Mon-Fri)",
                    "price": 99,
                    "description": "Buy 1 Get 1 Free Cheese Margherita Pizza (Monday to Friday Special)",
                    "image": "assets/pizza1.jpg",
                    "veg": True
                },
                {
                    "name": "Free Margherita on ₹500+ Bill",
                    "price": 0,
                    "description": "Get 1 Free Margherita Pizza on any bill above ₹500!",
                    "image": "assets/pizza2.jpg",
                    "veg": True
                }
            ]
        },
        {
            "name": "Burgers",
            "items": [
                {
                    "name": "Classic Aloo Tikki Burger",
                    "price": 70,
                    "description": "Crispy golden potato patty with house spices and mayo",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Crispy Veg Burger",
                    "price": 80,
                    "description": "Crunchy mixed vegetable patty with lettuce and creamy mayo",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Mix Veg Momo Burger",
                    "price": 89,
                    "description": "Special fusion burger loaded with steamed mix veg momos",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Spicy Veg Momo Burger",
                    "price": 89,
                    "description": "Hot & spicy momo stuffed inside a soft toasted burger bun",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Classic Double Patty Burger",
                    "price": 90,
                    "description": "Double crispy patties with extra lettuce, mayo, and cheese",
                    "image": "assets/burger_and_fries.png",
                    "veg": True
                },
                {
                    "name": "Spicy Tangy Aloo Tikki Burger",
                    "price": 90,
                    "description": "Zesty spicy aloo tikki with tangy house secret sauce",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Veg Cheese Momo Burger",
                    "price": 99,
                    "description": "Cheesy momo filling inside a toasted brioche bun",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Paneer Momo Burger",
                    "price": 99,
                    "description": "Paneer stuffed momos placed inside a burger bun",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Paneer Tikka Momo Burger",
                    "price": 99,
                    "description": "Smoky paneer tikka momo fusion burger",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Corn Cheese Momo Burger",
                    "price": 99,
                    "description": "Melted cheese and sweet corn momo patty burger",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Veggie Double Patty Burger",
                    "price": 100,
                    "description": "Loaded double vegetable patty for ultimate hunger",
                    "image": "assets/burger_and_fries.png",
                    "veg": True
                },
                {
                    "name": "Veg Cheese Burger",
                    "price": 100,
                    "description": "Classic veg patty topped with a thick melt of Amul cheese",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Cheesy Peri-Peri Burger",
                    "price": 110,
                    "description": "Spicy peri-peri seasoned patty drenched in melted cheese",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Corn & Cheese Burger",
                    "price": 110,
                    "description": "Golden sweet corn patty with double cheese layer",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Mexican Patty Burger",
                    "price": 120,
                    "description": "Spicy Mexican bean & corn patty with jalapenos and salsa mayo",
                    "image": "assets/burger_hero.png",
                    "veg": True
                },
                {
                    "name": "Mexican Double Patty Burger",
                    "price": 130,
                    "description": "Double Mexican patty with extra cheese and hot jalapenos",
                    "image": "assets/burger_and_fries.png",
                    "veg": True
                },
                {
                    "name": "Keto Burger (Protein Packed Bliss)",
                    "price": 130,
                    "description": "Low carb, high protein veg patty loaded with fresh cottage cheese",
                    "image": "assets/burger_hero.png",
                    "veg": True
                }
            ]
        },
        {
            "name": "Momos (6 Pcs)",
            "items": [
                {
                    "name": "Mix Veg Momos (Steam)",
                    "price": 70,
                    "description": "Steamed dumplings filled with seasoned finely chopped vegetables",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Mix Veg Momos (Pan Fry)",
                    "price": 80,
                    "description": "Crispy pan-fried mix vegetable momos",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Mix Veg Momos (Deep Fry)",
                    "price": 100,
                    "description": "Golden deep-fried crispy mix veg dumplings",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Spicy Veg Momos (Steam)",
                    "price": 80,
                    "description": "Steamed momos with hot chilli veg filling",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Paneer Momos (Steam)",
                    "price": 100,
                    "description": "Rich cottage cheese stuffed dumplings, perfectly steamed",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Veg Cheese Momos (Steam)",
                    "price": 100,
                    "description": "Melted cheese and vegetable stuffed steamed momos",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Paneer Tikka Momos (Steam)",
                    "price": 100,
                    "description": "Tandoori paneer tikka stuffed steamed momos",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Cheese Corn Momos (Steam)",
                    "price": 110,
                    "description": "Juicy sweet corn and mozzarella stuffed momos",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Hot Garlic Schezwan Pan-Fried Momos",
                    "price": 100,
                    "description": "Pan-fried momos tossed in spicy Schezwan hot garlic sauce",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Darjeeling Momo in Cheese Sauce",
                    "price": 110,
                    "description": "Pan-fried authentic Darjeeling momos smothered in rich cheese sauce",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Darjeeling Garlic Molten Cheese Momos",
                    "price": 120,
                    "description": "Steamed garlic momos served over a bed of molten lava cheese",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Corn & Cheese Molten Cheese Momos",
                    "price": 130,
                    "description": "Steamed corn cheese momos drenched in warm cheesy molten sauce",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Deep Fried Garlic Peri-Peri Momos",
                    "price": 120,
                    "description": "Crispy deep fried momos tossed with zesty peri-peri spice dust",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Himalayan Paneer Deep Fried Peri-Peri Momos",
                    "price": 130,
                    "description": "Paneer stuffed deep fried momos tossed in spicy Himalayan seasoning",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Corn & Cheese Schezwan Pan-Fried Momos",
                    "price": 140,
                    "description": "Cheese corn momos pan-fried in fiery Schezwan glaze",
                    "image": "assets/store_item.webp",
                    "veg": True
                }
            ]
        },
        {
            "name": "French Fries",
            "items": [
                {
                    "name": "Salted Fries (Medium)",
                    "price": 79,
                    "description": "Classic golden salted potato fries (180g)",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Salted Fries (Large)",
                    "price": 110,
                    "description": "Jumbo size classic golden salted potato fries (250g)",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Peri-Peri Fries (Medium)",
                    "price": 100,
                    "description": "Crispy fries tossed in hot & spicy African peri-peri seasoning",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Peri-Peri Fries (Large)",
                    "price": 140,
                    "description": "Large portion peri-peri seasoned crispy french fries",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Cheesy Salted Fries (Medium)",
                    "price": 130,
                    "description": "Golden salted fries loaded with warm liquid Amul cheese",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Cheesy Salted Fries (Large)",
                    "price": 170,
                    "description": "Jumbo fries completely covered in melted cheese dip",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Cheesy Peri-Peri Fries (Medium)",
                    "price": 150,
                    "description": "Peri-peri spiced fries drizzled with melted cheese sauce",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Cheesy Peri-Peri Fries (Large)",
                    "price": 200,
                    "description": "Large spicy peri-peri fries smothered in double cheese",
                    "image": "assets/fries_side.png",
                    "veg": True
                },
                {
                    "name": "Veg Cheesy Jalapeno Peri-Peri Fries",
                    "price": 180,
                    "description": "Ultimate fries bowl with peri-peri, jalapenos, and molten cheese",
                    "image": "assets/fries_side.png",
                    "veg": True
                }
            ]
        },
        {
            "name": "Garlic Breads & Sides",
            "items": [
                {
                    "name": "Plain Garlic Bread (2 Pcs)",
                    "price": 59,
                    "description": "Freshly baked garlic bread with herb butter glaze",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Cheese Garlic Bread (2 Pcs)",
                    "price": 79,
                    "description": "Garlic bread topped with 100% Amul Mozzarella melt",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Corn & Cheese Garlic Bread (2 Pcs)",
                    "price": 89,
                    "description": "Garlic bread baked with juicy sweet corn and melted cheese",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Peri Peri Garlic Bread (2 Pcs)",
                    "price": 89,
                    "description": "Spicy peri-peri seasoned cheesy garlic bread",
                    "image": "assets/store_item.webp",
                    "veg": True
                }
            ]
        },
        {
            "name": "Dips (30ml)",
            "items": [
                {
                    "name": "Mayo Dip",
                    "price": 20,
                    "description": "Creamy rich mayonnaise dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Cheesy Dip",
                    "price": 20,
                    "description": "Warm liquid Amul cheese dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Garlic Mayo Dip",
                    "price": 20,
                    "description": "Garlic infused rich mayo dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Schezwan Dip",
                    "price": 20,
                    "description": "Fiery hot Schezwan chilli dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Mexican Cheesy Dip",
                    "price": 20,
                    "description": "Spicy Mexican seasoned cheese dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Tandoori Mayo Dip",
                    "price": 20,
                    "description": "Smoky tandoori spiced mayo dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Peri-Peri Mayo Dip",
                    "price": 20,
                    "description": "African peri-peri chilli mayo dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "BBQ Mayo Dip",
                    "price": 20,
                    "description": "Smoky sweet BBQ Mayo dip (30ml)",
                    "image": "assets/store_item.webp",
                    "veg": True
                }
            ]
        },
        {
            "name": "Waffles & Desserts",
            "items": [
                {
                    "name": "Vanilla Ice Cream",
                    "price": 39,
                    "description": "Classic creamy vanilla scoop",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Crunchy Waffle",
                    "price": 99,
                    "description": "Freshly baked crisp Belgian waffle",
                    "image": "assets/chocolate_waffle.png",
                    "veg": True
                },
                {
                    "name": "Chocolate Waffle",
                    "price": 99,
                    "description": "Waffle smothered in warm melted Belgian chocolate sauce",
                    "image": "assets/chocolate_waffle.png",
                    "veg": True
                },
                {
                    "name": "Brownie with Ice Cream",
                    "price": 120,
                    "description": "Rich fudgy chocolate brownie served with vanilla ice cream",
                    "image": "assets/chocolate_waffle.png",
                    "veg": True
                },
                {
                    "name": "Sizzling Brownie with Ice Cream",
                    "price": 129,
                    "description": "Hot sizzling brownie on a cast iron plate topped with ice cream",
                    "image": "assets/chocolate_waffle.png",
                    "veg": True
                }
            ]
        },
        {
            "name": "Coolers & Shakes",
            "items": [
                {
                    "name": "Lemon Iced Tea",
                    "price": 69,
                    "description": "Chilled refreshing lemon flavoured iced tea",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Peach Iced Tea",
                    "price": 79,
                    "description": "Sweet peach infused chilled iced tea",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Classic Cold Coffee",
                    "price": 89,
                    "description": "Thick blended cold coffee with milk and ice cream",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Chocolate Shake",
                    "price": 89,
                    "description": "Rich chocolate milkshake topped with cocoa dust",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Vanilla Shake",
                    "price": 99,
                    "description": "Thick vanilla ice cream shake",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Chocolate Cold Coffee",
                    "price": 99,
                    "description": "Cold coffee blended with rich chocolate fudge",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Kitkat Shake",
                    "price": 109,
                    "description": "Thick shake loaded with crushed Kitkat wafer bars",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Virgin Mojito",
                    "price": 109,
                    "description": "Fizzy lime and fresh mint leaves mocktail cooler",
                    "image": "assets/store_item.webp",
                    "veg": True
                },
                {
                    "name": "Oreo Brownie Shake",
                    "price": 129,
                    "description": "Ultimate shake with blended Oreo cookies and chocolate brownie",
                    "image": "assets/chocolate_waffle.png",
                    "veg": True
                }
            ]
        }
    ]
}

with open('data/menu.json', 'w', encoding='utf-8') as f:
    json.dump(menu_data, f, indent=2)

print("menu.json successfully updated!")
