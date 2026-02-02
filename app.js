// Storage key
const STORAGE_KEY = 'foodExpiryProducts';

// DOM Elements
const productForm = document.getElementById('productForm');
const productNameInput = document.getElementById('productName');
const expiryDateInput = document.getElementById('expiryDate');
const productImageInput = document.getElementById('productImage');
const imagePreview = document.getElementById('imagePreview');
const productsList = document.getElementById('productsList');
const emptyMessage = document.getElementById('emptyMessage');

// Current image data
let currentImageData = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    expiryDateInput.setAttribute('min', today);

    // Load and display products
    renderProducts();

    // Check for expiring products and send notifications
    checkExpiringProducts();

    // Setup notification banner
    setupNotificationBanner();
});

// Image preview handler
productImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            currentImageData = event.target.result;
            imagePreview.style.backgroundImage = `url(${currentImageData})`;
            imagePreview.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    }
});

// Form submission
productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const product = {
        id: generateId(),
        name: productNameInput.value.trim(),
        expiryDate: expiryDateInput.value,
        image: currentImageData,
        createdAt: new Date().toISOString(),
        notified: false
    };

    // Save product
    const products = getProducts();
    products.push(product);
    saveProducts(products);

    // Reset form
    productForm.reset();
    currentImageData = null;
    imagePreview.style.backgroundImage = '';
    imagePreview.classList.remove('has-image');

    // Re-render
    renderProducts();

    // Schedule notification for this product
    scheduleProductNotification(product);
});

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// LocalStorage functions
function getProducts() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

// Delete product
function deleteProduct(id) {
    const products = getProducts().filter(p => p.id !== id);
    saveProducts(products);
    renderProducts();
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get status class and text
function getProductStatus(daysUntilExpiry) {
    if (daysUntilExpiry < 0) {
        return { class: 'expired', statusClass: 'danger', text: 'פג תוקף!' };
    } else if (daysUntilExpiry === 0) {
        return { class: 'expiring-soon', statusClass: 'danger', text: 'פג היום!' };
    } else if (daysUntilExpiry === 1) {
        return { class: 'expiring-soon', statusClass: 'warning', text: 'פג מחר!' };
    } else if (daysUntilExpiry <= 3) {
        return { class: 'expiring-soon', statusClass: 'warning', text: `פג בעוד ${daysUntilExpiry} ימים` };
    }
    return { class: '', statusClass: '', text: '' };
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Render products list
function renderProducts() {
    const products = getProducts();

    // Sort by expiry date (closest first)
    products.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    if (products.length === 0) {
        productsList.innerHTML = '';
        emptyMessage.classList.remove('hidden');
        return;
    }

    emptyMessage.classList.add('hidden');

    productsList.innerHTML = products.map(product => {
        const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
        const status = getProductStatus(daysUntilExpiry);

        const imageHtml = product.image
            ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
            : `<div class="product-image no-image">📦</div>`;

        const statusHtml = status.text
            ? `<div class="product-status ${status.statusClass}">${status.text}</div>`
            : '';

        return `
            <div class="product-card ${status.class}">
                ${imageHtml}
                <div class="product-info">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-expiry">תפוגה: ${formatDate(product.expiryDate)}</div>
                    ${statusHtml}
                </div>
                <div class="product-actions">
                    <button class="btn-delete" onclick="deleteProduct('${product.id}')">מחק</button>
                </div>
            </div>
        `;
    }).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Check for expiring products
function checkExpiringProducts() {
    const products = getProducts();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    products.forEach(product => {
        const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

        // Notify for products expiring tomorrow that haven't been notified
        if (daysUntilExpiry === 1 && !product.notified) {
            sendExpiryNotification(product);

            // Mark as notified
            product.notified = true;
        }
    });

    saveProducts(products);
}

// Send expiry notification
function sendExpiryNotification(product) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('מוצר עומד לפוג!', {
            body: `${product.name} יפוג מחר (${formatDate(product.expiryDate)})`,
            icon: product.image || undefined,
            tag: product.id
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// Schedule notification for a product
function scheduleProductNotification(product) {
    const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);

    if (daysUntilExpiry === 1) {
        // Product expires tomorrow, notify now
        sendExpiryNotification(product);
    }
}

// Setup notification banner
function setupNotificationBanner() {
    const banner = document.getElementById('notificationBanner');
    const enableBtn = document.getElementById('enableNotifications');
    const dismissBtn = document.getElementById('dismissBanner');

    // Check if notifications are supported and not yet granted
    if (!('Notification' in window)) {
        banner.classList.add('hidden');
        return;
    }

    if (Notification.permission === 'granted') {
        banner.classList.add('hidden');
        return;
    }

    if (Notification.permission === 'denied') {
        banner.classList.add('hidden');
        return;
    }

    // Show banner for 'default' state
    banner.classList.remove('hidden');

    enableBtn.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            banner.classList.add('hidden');
            // Register service worker for background notifications
            registerServiceWorker();
        }
    });

    dismissBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
    });
}

// Register service worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}
