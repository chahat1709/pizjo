import asyncio
import json
from playwright.async_api import async_playwright

async def extract_images():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        print("Navigating to Zomato...")
        
        await page.goto('https://www.zomato.com/ahmedabad/pizjo-amraiwadi/order', timeout=60000)
        await page.wait_for_timeout(5000)
        
        print("Scrolling...")
        for _ in range(15):
            await page.mouse.wheel(0, 1000)
            await page.wait_for_timeout(1000)
            
        print("Extracting items with images...")
        menu_data = await page.evaluate('''() => {
            const items = [];
            // Zomato items usually have an h4 for the name and an image tag somewhere nearby
            const h4s = document.querySelectorAll('h4');
            h4s.forEach(h4 => {
                const name = h4.innerText.trim();
                const container = h4.closest('div').parentElement;
                if (!container) return;
                
                // Find image in the container
                let imgUrl = null;
                const img = container.querySelector('img');
                if (img) {
                    imgUrl = img.src;
                } else {
                    // Try to find background image
                    const divs = container.querySelectorAll('div');
                    for (const d of divs) {
                        const bg = window.getComputedStyle(d).backgroundImage;
                        if (bg && bg !== 'none' && bg.includes('url')) {
                            imgUrl = bg.slice(5, -2);
                            break;
                        }
                    }
                }
                
                if (name && imgUrl && !imgUrl.includes('data:image')) {
                    // high-res image logic - replace 'fit=around|200:200' with something bigger if possible, or just keep it
                    imgUrl = imgUrl.replace('?fit=around|200:200', '?fit=around|600:600');
                    items.push({name, image: imgUrl});
                }
            });
            return items;
        }''')
        
        await browser.close()
        
        if menu_data:
            print(f"Extracted {len(menu_data)} images!")
            # Load current menu.json
            with open('data/menu.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            # Create a lookup map for fuzzy matching
            img_map = {item['name'].lower(): item['image'] for item in menu_data}
            
            updated_count = 0
            for cat in data.get('categories', []):
                for item in cat.get('items', []):
                    item_name_lower = item['name'].lower()
                    
                    # Exact match
                    if item_name_lower in img_map:
                        item['image'] = img_map[item_name_lower]
                        updated_count += 1
                        continue
                        
                    # Partial match
                    for zom_name, img_url in img_map.items():
                        if zom_name in item_name_lower or item_name_lower in zom_name:
                            item['image'] = img_url
                            updated_count += 1
                            break
                            
            with open('data/menu.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2)
                
            print(f"Updated {updated_count} items in menu.json with real Zomato images!")
        else:
            print("Failed to extract images from Zomato.")

if __name__ == '__main__':
    asyncio.run(extract_images())
