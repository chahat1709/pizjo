const fs = require('fs');
const https = require('https');

https.get('https://digital-order-api.dotpe.in/api/v1/customer/catalog?store_id=8579865', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            if (parsedData && parsedData.items && parsedData.categories) {
                console.log('Got catalog! Categories:', Object.keys(parsedData.categories).length, 'Items:', Object.keys(parsedData.items).length);
                
                // transform dotpe format to our menu.json format
                const out = { categories: [] };
                
                const cats = Object.values(parsedData.categories).sort((a,b) => a.order - b.order);
                let fallbackCount = 1;
                for (const cat of cats) {
                    const catData = {
                        name: cat.title,
                        items: []
                    };
                    for (const itemId of cat.item_ids) {
                        const it = parsedData.items[itemId];
                        if (!it) continue;
                        
                        let image = null;
                        if (it.image_url) {
                            image = it.image_url;
                        }
                        
                        catData.items.push({
                            name: it.title,
                            price: it.price,
                            description: it.description || '',
                            image: image,
                            veg: it.food_type === 1
                        });
                    }
                    if (catData.items.length > 0) {
                        out.categories.push(catData);
                    }
                }
                
                fs.writeFileSync('data/menu.json', JSON.stringify(out, null, 2));
                console.log('menu.json created successfully!');
            } else {
                console.log('Unexpected response:', rawData.substring(0, 200));
            }
        } catch (e) {
            console.error(e.message);
        }
    });
}).on('error', (e) => {
    console.error(`Got error: ${e.message}`);
});
