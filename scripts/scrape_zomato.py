import asyncio
import json
import os
import re
from playwright.async_api import async_playwright

async def run(playwright):
    browser = await playwright.chromium.launch(headless=False)
    context = await browser.new_context(
        user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    page = await context.new_page()
    print("Navigating to Zomato Pizjo order page...")
    
    await page.goto('https://www.zomato.com/ahmedabad/pizjo-amraiwadi/order', timeout=60000)
    
    # Wait for the page to load
    await page.wait_for_timeout(5000)
    
    print("Scrolling to load all items...")
    # Scroll down multiple times to trigger lazy loading
    for _ in range(15):
        await page.mouse.wheel(0, 1000)
        await page.wait_for_timeout(1000)
        
    print("Extracting menu items...")
    
    # Zomato usually groups items into sections (e.g., 'Pizza', 'Burger')
    # We will look for all h4 elements, assuming they are item titles or category titles.
    # More specifically, categories usually have larger fonts or are in a specific navigation.
    # To be safe and generic, we will extract all items by looking at the price tags (₹)
    
    items_data = []
    
    # Let's use evaluate to run JS in the browser context to find items
    menu_data = await page.evaluate('''() => {
        const data = [];
        // Attempt to find category sections. Zomato usually uses section tags or specific div structures.
        // A generic approach: find all headers (h2, h3, h4). The ones that group items are categories.
        // For each item, look for a price containing '₹'.
        
        // Zomato typically wraps items in a div that contains an h4 (name), a span with price, and a p with description.
        const itemWrappers = Array.from(document.querySelectorAll('h4')).map(h4 => h4.closest('div'));
        
        let currentCategory = "Menu";
        
        // Zomato's categories are often in an aside or sticky header. 
        // We can just extract all items and group them.
        const allItems = Array.from(document.querySelectorAll('h4')).map(h4 => {
            const container = h4.parentElement.parentElement;
            if (!container) return null;
            
            const name = h4.innerText.trim();
            const textContent = container.innerText;
            
            // Extract price
            const priceMatch = textContent.match(/₹[\d,]+/);
            const price = priceMatch ? parseInt(priceMatch[0].replace('₹', '').replace(',', '')) : 0;
            
            // Extract description (usually the longest paragraph or text after name and price)
            const pTags = Array.from(container.querySelectorAll('p'));
            let desc = "";
            if (pTags.length > 0) {
                // Find the p tag that is likely a description (not a badge like 'MUST TRY')
                const descTags = pTags.filter(p => p.innerText.length > 20);
                if (descTags.length > 0) desc = descTags[0].innerText.trim();
            }
            
            if (price > 0 && name) {
                return {
                    name: name,
                    price: price,
                    description: desc
                };
            }
            return null;
        }).filter(Boolean);
        
        return allItems;
    }''')
    
    # Group items if needed, but since we couldn't reliably get categories via generic JS, 
    # we'll create some default categories based on item names (Pizza, Burger, etc.) if we just got a flat list.
    
    if not menu_data:
        print("Failed to extract items using generic DOM traversal. Attempting alternate method.")
    else:
        print(f"Successfully extracted {len(menu_data)} items!")
        
        # Deduplicate and clean
        unique_items = {}
        for item in menu_data:
            unique_items[item['name']] = item
            
        final_list = list(unique_items.values())
        print(f"Unique items: {len(final_list)}")
        
        # Simple categorization
        categorized = {
            "Pizza": [],
            "Burger": [],
            "Sides": [],
            "Beverages": [],
            "Dessert": [],
            "Others": []
        }
        
        for item in final_list:
            name_lower = item['name'].lower()
            if 'pizza' in name_lower or 'margherita' in name_lower:
                categorized["Pizza"].append(item)
            elif 'burger' in name_lower:
                categorized["Burger"].append(item)
            elif 'fries' in name_lower or 'garlic bread' in name_lower or 'momo' in name_lower or 'calzone' in name_lower:
                categorized["Sides"].append(item)
            elif 'shake' in name_lower or 'mojito' in name_lower or 'coke' in name_lower or 'cooler' in name_lower:
                categorized["Beverages"].append(item)
            elif 'brownie' in name_lower or 'waffle' in name_lower or 'cake' in name_lower:
                categorized["Dessert"].append(item)
            else:
                categorized["Others"].append(item)
                
        # Format as expected by our app
        output_data = {
            "categories": [{"name": k, "items": v} for k, v in categorized.items() if len(v) > 0]
        }
        
        os.makedirs(os.path.join(os.path.dirname(__file__), '..', 'data'), exist_ok=True)
        with open(os.path.join(os.path.dirname(__file__), '..', 'data', 'menu.json'), 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=4, ensure_ascii=False)
            
        print("Menu data saved to data/menu.json")

    await browser.close()

async def main():
    async with async_playwright() as playwright:
        await run(playwright)

if __name__ == '__main__':
    asyncio.run(main())
