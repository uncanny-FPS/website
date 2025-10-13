// Global variables
let products = [];
let categories = [];
let subcategories = [];
let isAdminLoggedIn = false;
let currentTheme = 'light';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Vercel application...');
    loadTheme();
    setupEventListeners();
    loadDataFromServer();
    setupHiddenAdminAccess();
    updateAdminUI();
    updateProductsDropdown();
    updateCategoryDropdowns();
    updateProductsDisplay();
});

// Load data from server
async function loadDataFromServer() {
    try {
        console.log('Loading data from server...');
        const response = await fetch('/api/data');
        if (response.ok) {
            const data = await response.json();
            categories = data.categories || [];
            subcategories = data.subcategories || [];
            products = data.products || [];
            console.log('Data loaded from server:', { categories: categories.length, subcategories: subcategories.length, products: products.length });
        } else {
            console.log('Server not available, loading from localStorage...');
            loadDataFromLocalStorage();
        }
    } catch (error) {
        console.log('Server error, loading from localStorage:', error);
        loadDataFromLocalStorage();
    }
    
    updateProductsDropdown();
    updateCategoryDropdowns();
    updateProductsDisplay();
}

// Fallback to localStorage
function loadDataFromLocalStorage() {
    try {
        const savedCategories = localStorage.getItem('categories');
        const savedSubcategories = localStorage.getItem('subcategories');
        const savedProducts = localStorage.getItem('products');
        
        if (savedCategories) categories = JSON.parse(savedCategories);
        if (savedSubcategories) subcategories = JSON.parse(savedSubcategories);
        if (savedProducts) products = JSON.parse(savedProducts);
        
        console.log('Data loaded from localStorage:', { categories: categories.length, subcategories: subcategories.length, products: products.length });
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Save data to server
async function saveDataToServer(data, type) {
    try {
        const response = await fetch('/api/data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ type, ...data })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`Data saved to server: ${type}`, result);
            return result;
        } else {
            throw new Error('Server save failed');
        }
    } catch (error) {
        console.log(`Server save failed for ${type}, using localStorage only:`, error);
        return null;
    }
}

// Save to localStorage as backup
function saveToLocalStorage() {
    try {
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('subcategories', JSON.stringify(subcategories));
        localStorage.setItem('products', JSON.stringify(products));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Theme Management
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon();
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) {
        themeIcon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }
}

// Event Listeners
function setupEventListeners() {
    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', handleAdminLogin);
    }

    // Product form
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', handleProductSubmit);
    }

    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }

    // Image preview
    const imageInput = document.getElementById('productImages');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }

    // Mobile navigation
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu) {
                navMenu.classList.remove('active');
            }
        });
    });
}

// Hidden Admin Access
function setupHiddenAdminAccess() {
    // Keyboard shortcut: A-D-M-I-N
    let keySequence = [];
    const targetSequence = ['KeyA', 'KeyD', 'KeyM', 'KeyI', 'KeyN'];
    
    document.addEventListener('keydown', function(event) {
        keySequence.push(event.code);
        
        // Keep only the last 5 keys
        if (keySequence.length > 5) {
            keySequence.shift();
        }
        
        // Check if sequence matches
        if (keySequence.length === 5 && 
            keySequence.every((key, index) => key === targetSequence[index])) {
            console.log('Admin access triggered via keyboard shortcut');
            showAdminLogin();
            keySequence = []; // Reset sequence
        }
    });
}

// Admin Login Functions
function showAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAdminLogin() {
    const modal = document.getElementById('adminLoginModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleAdminLogin(event) {
    event.preventDefault();
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    // Simple admin credentials
    if (username === 'admin' && password === 'admin123') {
        isAdminLoggedIn = true;
        localStorage.setItem('isAdminLoggedIn', 'true');
        closeAdminLogin();
        updateAdminUI();
        showNotification('Admin login successful!', 'success');
        console.log('Admin logged in successfully');
    } else {
        showNotification('Invalid credentials!', 'error');
        console.log('Admin login failed');
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    localStorage.removeItem('isAdminLoggedIn');
    updateAdminUI();
    showNotification('Admin logged out', 'info');
    console.log('Admin logged out');
}

function updateAdminUI() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    isAdminLoggedIn = isLoggedIn;
    
    const adminElements = document.querySelectorAll('.admin-only');
    const logoutLink = document.getElementById('adminLogoutLink');
    
    adminElements.forEach(element => {
        if (isLoggedIn) {
            element.style.display = 'block';
            element.classList.add('show');
        } else {
            element.style.display = 'none';
            element.classList.remove('show');
        }
    });
    
    if (logoutLink) {
        logoutLink.style.display = isLoggedIn ? 'block' : 'none';
    }
}

// Category Management
async function addCategory() {
    const categoryInput = document.getElementById('newCategory');
    const categoryName = categoryInput.value.trim();
    
    if (!categoryName) {
        showNotification('Please enter a category name', 'error');
        return;
    }
    
    const newCategory = {
        key: Date.now().toString(),
        name: categoryName
    };
    
    // Try to save to server first
    const serverResult = await saveDataToServer({ name: categoryName }, 'category');
    
    if (serverResult) {
        categories.push(serverResult.category);
    } else {
        categories.push(newCategory);
    }
    
    categoryInput.value = '';
    saveToLocalStorage();
    updateCategoryDropdowns();
    updateProductsDropdown();
    updateCategoriesDisplay();
    showNotification('Category added successfully!', 'success');
    console.log('Category added:', newCategory);
}

async function addSubcategory() {
    const parentSelect = document.getElementById('parentCategory');
    const subcategoryInput = document.getElementById('newSubcategory');
    const parentCategory = parentSelect.value;
    const subcategoryName = subcategoryInput.value.trim();
    
    if (!parentCategory || !subcategoryName) {
        showNotification('Please select a parent category and enter a subcategory name', 'error');
        return;
    }
    
    const newSubcategory = {
        key: Date.now().toString(),
        name: subcategoryName,
        parentCategory: parentCategory
    };
    
    // Try to save to server first
    const serverResult = await saveDataToServer({ 
        name: subcategoryName, 
        parentCategory: parentCategory 
    }, 'subcategory');
    
    if (serverResult) {
        subcategories.push(serverResult.subcategory);
    } else {
        subcategories.push(newSubcategory);
    }
    
    subcategoryInput.value = '';
    saveToLocalStorage();
    updateCategoryDropdowns();
    updateProductsDropdown();
    updateCategoriesDisplay();
    showNotification('Subcategory added successfully!', 'success');
    console.log('Subcategory added:', newSubcategory);
}

async function deleteCategory(categoryKey) {
    if (!confirm('Are you sure you want to delete this category? This will also delete all its subcategories.')) {
        return;
    }
    
    // Try to delete from server
    try {
        const response = await fetch(`/api/data?type=category&key=${categoryKey}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            console.log('Server delete failed, using localStorage only');
        }
    } catch (error) {
        console.log('Server delete failed, using localStorage only:', error);
    }
    
    categories = categories.filter(cat => cat.key !== categoryKey);
    subcategories = subcategories.filter(sub => sub.parentCategory !== categoryKey);
    saveToLocalStorage();
    updateCategoryDropdowns();
    updateProductsDropdown();
    updateCategoriesDisplay();
    showNotification('Category deleted successfully!', 'success');
    console.log('Category deleted:', categoryKey);
}

async function editSubcategory(subcategoryKey) {
    const subcategory = subcategories.find(sub => sub.key === subcategoryKey);
    if (!subcategory) return;
    
    const newName = prompt('Enter new subcategory name:', subcategory.name);
    if (newName && newName.trim() !== subcategory.name) {
        // Try to update on server
        try {
            const response = await fetch('/api/data', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: 'subcategory', key: subcategoryKey, name: newName.trim() })
            });
            
            if (response.ok) {
                const result = await response.json();
                const index = subcategories.findIndex(sub => sub.key === subcategoryKey);
                if (index !== -1) {
                    subcategories[index] = result.subcategory;
                }
            } else {
                throw new Error('Server update failed');
            }
        } catch (error) {
            console.log('Server update failed, using localStorage only:', error);
            const index = subcategories.findIndex(sub => sub.key === subcategoryKey);
            if (index !== -1) {
                subcategories[index].name = newName.trim();
            }
        }
        
        saveToLocalStorage();
        updateCategoryDropdowns();
        updateProductsDropdown();
        updateCategoriesDisplay();
        showNotification('Subcategory updated successfully!', 'success');
        console.log('Subcategory updated:', subcategoryKey);
    }
}

async function deleteSubcategory(subcategoryKey) {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
        return;
    }
    
    // Try to delete from server
    try {
        const response = await fetch(`/api/data?type=subcategory&key=${subcategoryKey}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            console.log('Server delete failed, using localStorage only');
        }
    } catch (error) {
        console.log('Server delete failed, using localStorage only:', error);
    }
    
    subcategories = subcategories.filter(sub => sub.key !== subcategoryKey);
    saveToLocalStorage();
    updateCategoryDropdowns();
    updateProductsDropdown();
    updateCategoriesDisplay();
    showNotification('Subcategory deleted successfully!', 'success');
    console.log('Subcategory deleted:', subcategoryKey);
}

function updateCategoryDropdowns() {
    const productCategorySelect = document.getElementById('productCategory');
    const parentCategorySelect = document.getElementById('parentCategory');
    const filterCategorySelect = document.getElementById('filterCategory');
    
    // Update product category dropdown
    if (productCategorySelect) {
        productCategorySelect.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.key;
            option.textContent = category.name;
            productCategorySelect.appendChild(option);
        });
    }
    
    // Update parent category dropdown
    if (parentCategorySelect) {
        parentCategorySelect.innerHTML = '<option value="">Select parent category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.key;
            option.textContent = category.name;
            parentCategorySelect.appendChild(option);
        });
    }
    
    // Update filter category dropdown
    if (filterCategorySelect) {
        filterCategorySelect.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.key;
            option.textContent = category.name;
            filterCategorySelect.appendChild(option);
        });
    }
}

function updateProductsDropdown() {
    const dropdown = document.getElementById('productsDropdown');
    if (!dropdown) return;
    
    dropdown.innerHTML = '';
    
    if (categories.length === 0) {
        const li = document.createElement('li');
        li.innerHTML = '<a href="#">No categories available</a>';
        dropdown.appendChild(li);
        return;
    }
    
    categories.forEach(category => {
        const categorySubcategories = subcategories.filter(sub => sub.parentCategory === category.key);
        
        const li = document.createElement('li');
        li.className = 'dropdown-submenu';
        
        const categoryLink = document.createElement('a');
        categoryLink.href = '#';
        categoryLink.textContent = category.name;
        li.appendChild(categoryLink);
        
        if (categorySubcategories.length > 0) {
            const submenu = document.createElement('ul');
            submenu.className = 'dropdown-menu-submenu';
            
            categorySubcategories.forEach(sub => {
                const subLi = document.createElement('li');
                const subLink = document.createElement('a');
                subLink.href = '#';
                subLink.textContent = sub.name;
                subLi.appendChild(subLink);
                submenu.appendChild(subLi);
            });
            
            li.appendChild(submenu);
        }
        
        dropdown.appendChild(li);
    });
}

function updateCategoriesDisplay() {
    const display = document.getElementById('categoriesDisplay');
    if (!display) return;
    
    console.log('Updating categories display');
    display.innerHTML = '';
    
    if (!categories || categories.length === 0) {
        display.innerHTML = '<p style="color: #666; font-style: italic;">No categories yet. Add some categories to get started!</p>';
        return;
    }
    
    categories.forEach(category => {
        // Create main category container
        const categoryContainer = document.createElement('div');
        categoryContainer.className = 'category-container';
        categoryContainer.style.cssText = `
            margin-bottom: 1.5rem;
            border: 1px solid #a0aec0;
            border-radius: 12px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            overflow: hidden;
        `;
        
        // Get subcategories for this category
        const categorySubcategories = subcategories.filter(sub => sub.parentCategory === category.key);
        
        // Create category header with expand/collapse functionality
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        categoryHeader.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem;
            cursor: pointer;
            background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
            color: white;
            border-radius: 12px 12px 0 0;
            transition: all 0.3s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        `;
        
        categoryHeader.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-chevron-right expand-icon" style="transition: transform 0.3s ease; color: #3498db; font-size: 1.1rem;"></i>
                <span style="font-weight: 600; font-size: 1.1rem; color: white;">${category.name}</span>
                <span style="background: #3498db; color: white; padding: 4px 10px; border-radius: 15px; font-size: 0.8rem; font-weight: 500; box-shadow: 0 2px 4px rgba(52, 152, 219, 0.3);">
                    ${categorySubcategories.length} subcategories
                </span>
            </div>
            <button class="delete-btn" onclick="deleteCategory('${category.key}')" style="background: #dc3545; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
        `;
        
        // Create subcategories container (initially hidden)
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.className = 'subcategories-container';
        subcategoriesContainer.style.cssText = `
            display: none;
            padding: 1.5rem;
            background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
            border-radius: 0 0 12px 12px;
        `;
        
        if (categorySubcategories.length > 0) {
            categorySubcategories.forEach(sub => {
                const subDiv = document.createElement('div');
                subDiv.className = 'subcategory-item';
                subDiv.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem;
                    margin: 0.75rem 0;
                    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
                    border-radius: 12px;
                    border-left: 5px solid #4a5568;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    transition: all 0.3s ease;
                    border: 1px solid #a0aec0;
                `;
                subDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 8px; height: 8px; background: #3498db; border-radius: 50%;"></div>
                        <span style="font-weight: 600; color: #2c3e50; font-size: 1.1rem;">${sub.name}</span>
                    </div>
                    <div class="subcategory-actions" style="display: flex; gap: 0.75rem;">
                        <button class="edit-btn" onclick="editSubcategory('${sub.key}')" style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 8px rgba(39, 174, 96, 0.3);">Edit</button>
                        <button class="delete-btn" onclick="deleteSubcategory('${sub.key}')" style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 3px 8px rgba(231, 76, 60, 0.3);">Delete</button>
                    </div>
                `;
                // Add hover effects for subcategory items
                subDiv.addEventListener('mouseenter', function() {
                    subDiv.style.transform = 'translateY(-2px)';
                    subDiv.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)';
                    subDiv.style.borderLeftColor = '#2d3748';
                    subDiv.style.background = 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)';
                });
                
                subDiv.addEventListener('mouseleave', function() {
                    subDiv.style.transform = 'translateY(0)';
                    subDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    subDiv.style.borderLeftColor = '#4a5568';
                    subDiv.style.background = 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%)';
                });
                
                subcategoriesContainer.appendChild(subDiv);
            });
        } else {
            subcategoriesContainer.innerHTML = `
                <div style="text-align: center; color: #4a5568; font-style: italic; padding: 2.5rem; background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%); border-radius: 12px; border: 2px dashed #a0aec0; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <i class="fas fa-plus-circle" style="font-size: 2.5rem; color: #718096; margin-bottom: 1rem;"></i>
                    <br>
                    <span style="font-size: 1.1rem; font-weight: 500; color: #2d3748;">No subcategories yet</span>
                    <br>
                    <span style="font-size: 0.9rem; color: #4a5568;">Add some subcategories to this category</span>
                </div>
            `;
        }
        
        // Add click event to toggle subcategories
        categoryHeader.addEventListener('click', function() {
            const icon = categoryHeader.querySelector('.expand-icon');
            const isVisible = subcategoriesContainer.style.display !== 'none';
            
            if (isVisible) {
                subcategoriesContainer.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
                categoryHeader.style.background = 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)';
            } else {
                subcategoriesContainer.style.display = 'block';
                icon.style.transform = 'rotate(90deg)';
                categoryHeader.style.background = 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)';
            }
        });
        
        // Add hover effects
        categoryHeader.addEventListener('mouseenter', function() {
            if (subcategoriesContainer.style.display === 'none') {
                categoryHeader.style.background = 'linear-gradient(135deg, #2d3748 0%, #1a202c 100%)';
                categoryHeader.style.transform = 'translateY(-2px)';
                categoryHeader.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
            }
        });
        
        categoryHeader.addEventListener('mouseleave', function() {
            if (subcategoriesContainer.style.display === 'none') {
                categoryHeader.style.background = 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)';
                categoryHeader.style.transform = 'translateY(0)';
                categoryHeader.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }
        });
        
        // Assemble the category container
        categoryContainer.appendChild(categoryHeader);
        categoryContainer.appendChild(subcategoriesContainer);
        display.appendChild(categoryContainer);
    });
    
    console.log('Categories display updated with', categories.length, 'categories');
}

// Product Management
async function handleProductSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        name: formData.get('productName') || document.getElementById('productName').value,
        category: formData.get('productCategory') || document.getElementById('productCategory').value,
        subcategory: formData.get('productSubcategory') || document.getElementById('productSubcategory').value,
        description: formData.get('productDescription') || document.getElementById('productDescription').value,
        price: parseFloat(formData.get('productPrice') || document.getElementById('productPrice').value),
        images: [] // Handle images separately if needed
    };
    
    const newProduct = {
        key: Date.now().toString(),
        name: productData.name.trim(),
        category: productData.category,
        subcategory: productData.subcategory || '',
        description: productData.description.trim(),
        price: productData.price,
        images: productData.images,
        createdAt: new Date().toISOString()
    };
    
    // Try to save to server first
    const serverResult = await saveDataToServer(productData, 'product');
    
    if (serverResult) {
        products.push(serverResult.product);
    } else {
        products.push(newProduct);
    }
    
    event.target.reset();
    saveToLocalStorage();
    updateProductsDisplay();
    showNotification('Product added successfully!', 'success');
    console.log('Product added:', newProduct);
}

function handleImagePreview(event) {
    const files = event.target.files;
    const preview = document.getElementById('imagePreview');
    
    if (preview) {
        preview.innerHTML = '';
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.cssText = 'width: 100px; height: 100px; object-fit: cover; border-radius: 5px; border: 2px solid #ddd; margin: 5px;';
                    preview.appendChild(img);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

function updateProductsDisplay() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; grid-column: 1 / -1;">No products available yet.</p>';
        return;
    }
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const category = categories.find(cat => cat.key === product.category);
        const subcategory = subcategories.find(sub => sub.key === product.subcategory);
        
        productCard.innerHTML = `
            <img src="https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(product.name)}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-category">${category ? category.name : 'Uncategorized'}${subcategory ? ` - ${subcategory.name}` : ''}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price}</div>
                ${isAdminLoggedIn ? `
                    <div class="product-actions">
                        <button class="edit-btn" onclick="editProduct('${product.key}')">Edit</button>
                        <button class="delete-product-btn" onclick="deleteProduct('${product.key}')">Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        grid.appendChild(productCard);
    });
}

// Contact Form
function handleContactSubmit(event) {
    event.preventDefault();
    showNotification('Thank you for your message! We will get back to you soon.', 'success');
    event.target.reset();
}

// Utility Functions
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10001;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function clearAllData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
        return;
    }
    
    // Try to clear on server
    try {
        const response = await fetch('/api/data?type=all', {
            method: 'DELETE'
        });
        if (!response.ok) {
            console.log('Server clear failed, using localStorage only');
        }
    } catch (error) {
        console.log('Server clear failed, using localStorage only:', error);
    }
    
    categories = [];
    subcategories = [];
    products = [];
    saveToLocalStorage();
    updateCategoryDropdowns();
    updateProductsDropdown();
    updateCategoriesDisplay();
    updateProductsDisplay();
    showNotification('All data cleared successfully!', 'success');
    console.log('All data cleared');
}

// Filter Functions
function filterProducts() {
    const categoryFilter = document.getElementById('filterCategory').value;
    const subcategoryFilter = document.getElementById('filterSubcategory').value;
    
    let filteredProducts = products;
    
    if (categoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
    }
    
    if (subcategoryFilter) {
        filteredProducts = filteredProducts.filter(product => product.subcategory === subcategoryFilter);
    }
    
    // Update display with filtered products
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (filteredProducts.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; grid-column: 1 / -1;">No products match your filters.</p>';
        return;
    }
    
    filteredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        
        const category = categories.find(cat => cat.key === product.category);
        const subcategory = subcategories.find(sub => sub.key === product.subcategory);
        
        productCard.innerHTML = `
            <img src="https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(product.name)}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-category">${category ? category.name : 'Uncategorized'}${subcategory ? ` - ${subcategory.name}` : ''}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">${product.price}</div>
                ${isAdminLoggedIn ? `
                    <div class="product-actions">
                        <button class="edit-btn" onclick="editProduct('${product.key}')">Edit</button>
                        <button class="delete-product-btn" onclick="deleteProduct('${product.key}')">Delete</button>
                    </div>
                ` : ''}
            </div>
        `;
        
        grid.appendChild(productCard);
    });
}

function clearFilters() {
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterSubcategory').value = '';
    updateProductsDisplay();
}

// Initialize admin status on page load
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
    if (isLoggedIn) {
        isAdminLoggedIn = true;
        updateAdminUI();
    }
});


