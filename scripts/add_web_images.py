import json
import random

pizza_imgs = [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80"
]

burger_imgs = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1594212586991-af36c3422d3b?auto=format&fit=crop&w=600&q=80"
]

fries_imgs = [
    "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1630432243454-e0b4c2b9a785?auto=format&fit=crop&w=600&q=80"
]

momo_imgs = [
    "https://images.unsplash.com/photo-1496116218417-1f481d6f2868?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1528701967272-38be98f7127e?auto=format&fit=crop&w=600&q=80"
]

waffle_imgs = [
    "https://images.unsplash.com/photo-1565299507177-b0d466426b3c?auto=format&fit=crop&w=600&q=80"
]

brownie_imgs = [
    "https://images.unsplash.com/photo-1621287957424-6f028e5db6df?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=600&q=80"
]

drink_imgs = [
    "https://images.unsplash.com/photo-1572490122747-398b3f38018e?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1497534444406-8d6dce3f8511?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1572696014234-a15e612809fb?auto=format&fit=crop&w=600&q=80"
]

mojito_imgs = [
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
]

garlic_bread_imgs = [
    "https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1606859595514-99d90ec86cf5?auto=format&fit=crop&w=600&q=80"
]

dip_imgs = [
    "https://images.unsplash.com/photo-1624465495262-d2f6277bf27a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1585937421612-7010041a34bb?auto=format&fit=crop&w=600&q=80"
]

def get_img(cat_name, item_name):
    cat_name = cat_name.lower()
    item_name = item_name.lower()
    
    if "burger" in cat_name or "burger" in item_name:
        return random.choice(burger_imgs)
    elif "momo" in cat_name or "momo" in item_name:
        return random.choice(momo_imgs)
    elif "fries" in cat_name or "fries" in item_name:
        return random.choice(fries_imgs)
    elif "waffle" in item_name:
        return random.choice(waffle_imgs)
    elif "brownie" in item_name:
        return random.choice(brownie_imgs)
    elif "mojito" in item_name:
        return random.choice(mojito_imgs)
    elif "shake" in item_name or "coffee" in item_name or "tea" in item_name or "cooler" in cat_name:
        return random.choice(drink_imgs)
    elif "garlic bread" in cat_name or "garlic bread" in item_name:
        return random.choice(garlic_bread_imgs)
    elif "dip" in cat_name or "dip" in item_name:
        return random.choice(dip_imgs)
    elif "pizza" in cat_name or "pizza" in item_name or "calzone" in cat_name:
        return random.choice(pizza_imgs)
    else:
        return random.choice(pizza_imgs) # fallback to pizza

def main():
    with open('data/menu.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for cat in data.get('categories', []):
        cat_name = cat['name']
        for item in cat.get('items', []):
            item['image'] = get_img(cat_name, item['name'])
            
    with open('data/menu.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
        
    print("Done applying web images to menu.json!")

if __name__ == '__main__':
    main()
