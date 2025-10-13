const fs = require('fs');
const path = require('path');

// Data file path
const DATA_FILE = path.join(process.cwd(), 'data.json');

// Initialize data file if it doesn't exist
function initializeData() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            categories: [],
            subcategories: [],
            products: []
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Helper function to read data
function readData() {
    try {
        initializeData();
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { categories: [], subcategories: [], products: [] };
    }
}

// Helper function to write data
function writeData(data) {
    try {
        initializeData();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

module.exports = function handler(req, res) {
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
            const data = readData();
            return res.status(200).json(data);
        }
        
        // Route: POST /api/data (for categories, subcategories, products)
        if (method === 'POST') {
            const { type, ...data } = body;
            const allData = readData();
            
            if (type === 'category') {
                const newCategory = {
                    key: Date.now().toString(),
                    name: data.name.trim()
                };
                allData.categories.push(newCategory);
                
                if (writeData(allData)) {
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
                
                if (writeData(allData)) {
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
                
                if (writeData(allData)) {
                    return res.status(200).json({ success: true, product: newProduct });
                } else {
                    return res.status(500).json({ error: 'Failed to save product' });
                }
            }
        }
        
        // Route: DELETE /api/data
        if (method === 'DELETE') {
            const { type, key } = query;
            const allData = readData();
            
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
            
            if (writeData(allData)) {
                return res.status(200).json({ success: true });
            } else {
                return res.status(500).json({ error: 'Failed to delete' });
            }
        }
        
        // Route: PUT /api/data
        if (method === 'PUT') {
            const { type, key, name } = body;
            const allData = readData();
            
            if (type === 'subcategory') {
                const index = allData.subcategories.findIndex(sub => sub.key === key);
                if (index !== -1) {
                    allData.subcategories[index].name = name.trim();
                    
                    if (writeData(allData)) {
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
};
