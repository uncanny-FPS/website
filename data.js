// Vercel API Route for data management
import { kv } from '@vercel/kv';

// Helper function to read data from Vercel KV
async function readData() {
    try {
        // Try to get the 'data' key from KV storage
        const data = await kv.get('data');
        
        // If it doesn't exist, return the initial empty structure
        if (!data) {
            return { categories: [], subcategories: [], products: [] };
        }
        return data;
    } catch (error) {
        console.error('Error reading data from KV:', error);
        return { categories: [], subcategories: [], products: [] };
    }
}

// Helper function to write data to Vercel KV
async function writeData(data) {
    try {
        // Set the 'data' key in KV storage
        await kv.set('data', data);
        return true;
    } catch (error) {
        console.error('Error writing data to KV:', error);
        return false;
    }
}

// The main API handler function MUST be 'async' now
export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { method, query, body } = req;
        
        // Route: GET /api/data
        if (method === 'GET' && !query.action) {
            // Use 'await' because readData is now async
            const data = await readData(); 
            return res.status(200).json(data);
        }
        
        // Route: POST /api/data (for categories, subcategories, products)
        if (method === 'POST') {
            const { type, ...data } = body;
            // Use 'await'
            const allData = await readData(); 
            
            if (type === 'category') {
                const newCategory = {
                    key: Date.now().toString(),
                    name: data.name.trim()
                };
                allData.categories.push(newCategory);
                
                // Use 'await'
                if (await writeData(allData)) { 
                    return res.status(200).json({ success: true, category: newCategory });
                } else {
                    return res.status(500).json({ error: 'Failed to save category' });
                }
            }
            
            if (type === 'subcategory') {
                const newSubcategory = {
                    key: Date.now().toString(),
                    name: data.name.trim(),
                    parentCategory: data.parentCategory
                };
                allData.subcategories.push(newSubcategory);
                
                // Use 'await'
                if (await writeData(allData)) {
                    return res.status(200).json({ success: true, subcategory: newSubcategory });
                } else {
                    return res.status(500).json({ error: 'Failed to save subcategory' });
                }
            }
            
            if (type === 'product') {
                const newProduct = {
                    key: Date.now().toString(),
                    name: data.name.trim(),
                    category: data.category,
                    subcategory: data.subcategory || '',
                    description: data.description.trim(),
                    price: parseFloat(data.price),
                    images: data.images || [],
                    createdAt: new Date().toISOString()
                };
                allData.products.push(newProduct);
                
                // Use 'await'
                if (await writeData(allData)) {
                    return res.status(200).json({ success: true, product: newProduct });
                } else {
                    return res.status(500).json({ error: 'Failed to save product' });
                }
            }
        }
        
        // Route: DELETE /api/data
        if (method === 'DELETE') {
            const { type, key } = query;
            // Use 'await'
            const allData = await readData();
            
            if (type === 'category') {
                allData.categories = allData.categories.filter(cat => cat.key !== key);
                allData.subcategories = allData.subcategories.filter(sub => sub.parentCategory !== key);
            }
            
            if (type === 'subcategory') {
                allData.subcategories = allData.subcategories.filter(sub => sub.key !== key);
            }
            
            if (type === 'product') {
                allData.products = allData.products.filter(prod => prod.key !== key);
            }
            
            if (type === 'all') {
                allData.categories = [];
                allData.subcategories = [];
                allData.products = [];
            }
            
            // Use 'await'
            if (await writeData(allData)) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(500).json({ error: 'Failed to delete' });
            }
        }
        
        // Route: PUT /api/data
        if (method === 'PUT') {
            const { type, key, name } = body;
            // Use 'await'
            const allData = await readData();
            
            if (type === 'subcategory') {
                const index = allData.subcategories.findIndex(sub => sub.key === key);
                if (index !== -1) {
                    allData.subcategories[index].name = name.trim();
                    
                    // Use 'await'
                    if (await writeData(allData)) {
                        return res.status(200).json({ success: true, subcategory: allData.subcategories[index] });
                    } else {
                        return res.status(500).json({ error: 'Failed to update subcategory' });
                    }
                } else {
                    return res.status(404).json({ error: 'Subcategory not found' });
                }
            }
        }
        
        // Default response
        return res.status(404).json({ error: 'Endpoint not found' });
        
    } catch (error) {
        console.error('API error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}