const categoryOptions = [
    ['shirts', "Men's Shirts"],
    ['pants', "Men's Pants"],
    ['tshirts', 'T-Shirts'],
    ['kids', 'Kids Wear'],
    ['ladies', 'Ladies Wear'],
    ['accessories', 'Accessories']
];

let products = structuredClone(window.NOTICE_PRODUCTS || []);
let productsFileHandle = null;

const productsContainer = document.getElementById('adminProducts');
const statusText = document.getElementById('statusText');

function setStatus(message) {
    statusText.textContent = message;
}

function slugify(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;
}

function serializeProducts() {
    return `window.NOTICE_PRODUCTS = ${JSON.stringify(products, null, 4)};\n`;
}

function renderAdminProducts() {
    productsContainer.innerHTML = products.map((product, index) => `
        <article class="admin-product" data-index="${index}">
            <div class="admin-product-preview">
                ${product.image ? `<img src="${product.image}" alt="${product.name}">` : `<i class="fas ${product.icon || 'fa-shirt'}"></i>`}
            </div>
            <div class="admin-product-fields">
                <label>Product Name
                    <input data-field="name" value="${product.name || ''}">
                </label>
                <label>Price
                    <input data-field="price" type="number" min="0" value="${product.price || 0}">
                </label>
                <label>Category
                    <select data-field="category">
                        ${categoryOptions.map(([value, label]) => `<option value="${value}" ${product.category === value ? 'selected' : ''}>${label}</option>`).join('')}
                    </select>
                </label>
                <label>Badge
                    <input data-field="badge" value="${product.badge || ''}" placeholder="New / Hot / Bestseller">
                </label>
                <label>Image Path or URL
                    <input data-field="image" value="${product.image || ''}" placeholder="images/products/shirt.jpg">
                </label>
                <div class="admin-row-actions">
                    <label class="image-upload">
                        <i class="fas fa-image"></i> Add Image
                        <input type="file" accept="image/*" data-image-picker>
                    </label>
                    <button data-remove><i class="fas fa-trash"></i> Delete</button>
                </div>
            </div>
        </article>
    `).join('');
}

function syncProductFromInput(input) {
    const card = input.closest('.admin-product');
    const index = Number(card.dataset.index);
    const field = input.dataset.field;
    if (!field) {
        return;
    }

    products[index][field] = field === 'price' ? Number(input.value || 0) : input.value;
    if (field === 'name') {
        products[index].id = slugify(input.value);
    }
    setStatus('Unsaved changes');
}

productsContainer.addEventListener('input', event => {
    if (event.target.matches('[data-field]')) {
        syncProductFromInput(event.target);
    }
});

productsContainer.addEventListener('change', event => {
    if (event.target.matches('[data-image-picker]')) {
        const file = event.target.files[0];
        const card = event.target.closest('.admin-product');
        const index = Number(card.dataset.index);
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            products[index].image = reader.result;
            renderAdminProducts();
            setStatus('Image added. Save to publish.');
        };
        reader.readAsDataURL(file);
    }
});

productsContainer.addEventListener('click', event => {
    const removeButton = event.target.closest('[data-remove]');
    if (!removeButton) {
        return;
    }

    const index = Number(removeButton.closest('.admin-product').dataset.index);
    products.splice(index, 1);
    renderAdminProducts();
    setStatus('Product deleted. Save to publish.');
});

document.getElementById('addProductBtn').addEventListener('click', () => {
    products.push({
        id: `new-product-${Date.now()}`,
        name: 'New Product',
        category: 'shirts',
        price: 0,
        badge: 'New',
        rating: 5,
        image: '',
        icon: 'fa-shirt',
        gradient: 'linear-gradient(135deg, #1A3A5C 0%, #FF6B35 100%)'
    });
    renderAdminProducts();
    setStatus('New product added. Save to publish.');
});

document.getElementById('openFileBtn').addEventListener('click', async () => {
    if (!window.showOpenFilePicker) {
        setStatus('Open file works in Chrome/Edge only. Use Download File instead.');
        return;
    }

    [productsFileHandle] = await window.showOpenFilePicker({
        types: [{ description: 'Product data', accept: { 'text/javascript': ['.js'] } }],
        multiple: false
    });
    const file = await productsFileHandle.getFile();
    const content = await file.text();
    const jsonText = content.replace(/^window\.NOTICE_PRODUCTS\s*=\s*/, '').replace(/;\s*$/, '');
    products = JSON.parse(jsonText);
    renderAdminProducts();
    setStatus('products.js loaded');
});

document.getElementById('saveFileBtn').addEventListener('click', async () => {
    if (!window.showSaveFilePicker && !productsFileHandle) {
        setStatus('Save file works in Chrome/Edge only. Use Download File instead.');
        return;
    }

    if (!productsFileHandle) {
        productsFileHandle = await window.showSaveFilePicker({
            suggestedName: 'products.js',
            types: [{ description: 'Product data', accept: { 'text/javascript': ['.js'] } }]
        });
    }

    const writable = await productsFileHandle.createWritable();
    await writable.write(serializeProducts());
    await writable.close();
    setStatus('Saved to products.js');
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const blob = new Blob([serializeProducts()], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.js';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Downloaded products.js');
});

document.getElementById('githubSaveBtn').addEventListener('click', async () => {
    const owner = document.getElementById('githubOwner').value.trim();
    const repo = document.getElementById('githubRepo').value.trim();
    const branch = document.getElementById('githubBranch').value.trim() || 'main';
    const token = document.getElementById('githubToken').value.trim();

    if (!owner || !repo || !token) {
        setStatus('Enter GitHub owner, repo and token.');
        return;
    }

    setStatus('Saving to GitHub...');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/data/products.js`;
    const current = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' }
    });
    const currentJson = current.ok ? await current.json() : {};
    const encodedContent = btoa(unescape(encodeURIComponent(serializeProducts())));

    const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update product prices from admin',
            content: encodedContent,
            sha: currentJson.sha,
            branch
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setStatus(error.message || 'GitHub save failed');
        return;
    }

    setStatus('Saved to GitHub. Netlify will deploy if connected.');
});

renderAdminProducts();
