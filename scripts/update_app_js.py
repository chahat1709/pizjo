import re
import random

pizza_imgs = ['https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80']
burger_imgs = ['https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80']
fries_imgs = ['https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=600&q=80']

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

def repl(m):
    orig = m.group(0)
    if 'burger' in orig:
        return 'image: "' + burger_imgs[0] + '"'
    elif 'fries' in orig:
        return 'image: "' + fries_imgs[0] + '"'
    else:
        return 'image: "' + random.choice(pizza_imgs) + '"'

new_content = re.sub(r'image:\s*"assets/[^"]+"', repl, content)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Updated FALLBACK_MENU in js/app.js')
