// API Configuration
const API_BASE_URL = 'https://localhost:5001/api';

// State Management
const appState = {
    cart: [],
    products: [],
    categories: [],
    currentProduct: null
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadFeaturedProducts();
    loadCartFromStorage();
});

// Load Categories (COMPOSITE PATTERN)
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        const categories = await response.json();
        appState.categories = categories;

        const container = document.getElementById('categoriesContainer');
        container.innerHTML = categories.map(cat => `
            <div class="col-md-4 col-sm-6">
                <div class="card category-card" onclick="loadCategoryProducts(${cat.categoryId})">
                    <div class="card-body text-center">
                        <i class="fas fa-couch fa-3x mb-3 text-primary"></i>
                        <h5 class="card-title">${cat.name}</h5>
                        <p class="text-muted">${cat.children?.length || 0} danh mục con</p>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load Featured Products
async function loadFeaturedProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products/featured`);
        const products = await response.json();
        appState.products = products;

        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('productsContainer').innerHTML =
            '<div class="col-12 text-center text-danger">Lỗi tải sản phẩm</div>';
    }
}

// Display Products
function displayProducts(products) {
    const container = document.getElementById('productsContainer');

    if (products.length === 0) {
        container.innerHTML = '<div class="col-12 text-center">Không có sản phẩm</div>';
        return;
    }

    container.innerHTML = products.map(product => {
        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        const imageUrl = primaryImage?.imageUrl || 'https://via.placeholder.com/300x250?text=No+Image';
        const hasDiscount = product.discountPrice && product.discountPrice < product.basePrice;

        return `
            <div class="col-md-4 col-sm-6">
                <div class="card product-card h-100">
                    <img src="${imageUrl}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted">${product.description?.substring(0, 80) || ''}...</p>
                        <div class="mb-3">
                            ${hasDiscount ?
                `<span class="product-price-old">${formatPrice(product.basePrice)}</span>` : ''}
                            <div class="product-price">${formatPrice(product.discountPrice || product.basePrice)}</div>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="showProductDetail(${product.productId})">
                                <i class="fas fa-eye"></i> Xem chi tiết
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Show Product Detail (DECORATOR PATTERN - price calculation)
async function showProductDetail(productId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`);
        const product = await response.json();
        appState.currentProduct = product;

        const modal = new bootstrap.Modal(document.getElementById('productModal'));
        document.getElementById('modalProductName').textContent = product.name;

        const primaryImage = product.images?.find(img => img.isPrimary) || product.images?.[0];
        const imageUrl = primaryImage?.imageUrl || 'https://via.placeholder.com/400x300';

        // Group attributes by name
        const groupedAttrs = {};
        product.attributes?.forEach(attr => {
            if (!groupedAttrs[attr.attributeName]) {
                groupedAttrs[attr.attributeName] = [];
            }
            groupedAttrs[attr.attributeName].push(attr);
        });

        document.getElementById('modalBody').innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <img src="${imageUrl}" class="img-fluid rounded" alt="${product.name}">
                </div>
                <div class="col-md-6">
                    <h4 class="product-price mb-3" id="displayPrice">
                        ${formatPrice(product.discountPrice || product.basePrice)}
                    </h4>
                    <p>${product.description || ''}</p>
                    
                    <div class="mb-3">
                        <strong>Danh mục:</strong> ${product.category?.name || 'N/A'}<br>
                        <strong>Kích thước:</strong> ${product.width}cm x ${product.depth}cm x ${product.height}cm<br>
                        <strong>Trọng lượng:</strong> ${product.weight || 'N/A'}kg<br>
                        <strong>Tồn kho:</strong> ${product.stockQuantity} sản phẩm
                    </div>
                    
                    ${Object.keys(groupedAttrs).length > 0 ? `
                        <div class="mb-4">
                            <h6>Tùy chọn sản phẩm (DECORATOR PATTERN):</h6>
                            ${Object.entries(groupedAttrs).map(([attrName, attrs]) => `
                                <div class="mb-3">
                                    <label class="form-label fw-bold">${attrName}:</label>
                                    <div class="d-flex flex-wrap">
                                        ${attrs.map(attr => `
                                            <div class="attribute-option" 
                                                 data-attr-id="${attr.attributeId}"
                                                 data-attr-name="${attrName}"
                                                 data-price-adj="${attr.priceAdjustment}"
                                                 onclick="toggleAttribute(this)">
                                                <div>${attr.attributeValue}</div>
                                                ${attr.priceAdjustment > 0 ?
                `<small class="text-muted">+${formatPrice(attr.priceAdjustment)}</small>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <div class="mb-3">
                        <label class="form-label">Số lượng:</label>
                        <input type="number" class="form-control" id="quantity" value="1" min="1" max="${product.stockQuantity}">
                    </div>
                    
                    <div class="d-grid">
                        <button class="btn btn-primary btn-lg" onclick="addToCart()">
                            <i class="fas fa-cart-plus"></i> Thêm vào giỏ hàng
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.show();
    } catch (error) {
        console.error('Error loading product detail:', error);
        alert('Không thể tải chi tiết sản phẩm');
    }
}

// DECORATOR PATTERN: Toggle attribute selection
function toggleAttribute(element) {
    const attrName = element.dataset.attrName;

    // Deselect other options in same group
    document.querySelectorAll(`[data-attr-name="${attrName}"]`).forEach(el => {
        el.classList.remove('selected');
    });

    // Select this option
    element.classList.add('selected');

    // Recalculate price
    updateProductPrice();
}

// DECORATOR PATTERN: Calculate final price with selected attributes
function updateProductPrice() {
    const product = appState.currentProduct;
    if (!product) return;

    let basePrice = product.discountPrice || product.basePrice;
    let adjustment = 0;

    // Sum all selected attribute adjustments
    document.querySelectorAll('.attribute-option.selected').forEach(el => {
        adjustment += parseFloat(el.dataset.priceAdj);
    });

    const finalPrice = basePrice + adjustment;
    document.getElementById('displayPrice').textContent = formatPrice(finalPrice);
}

// Add to Cart
function addToCart() {
    const product = appState.currentProduct;
    const quantity = parseInt(document.getElementById('quantity').value);

    if (!product) return;

    // Get selected attributes
    const selectedAttributes = [];
    document.querySelectorAll('.attribute-option.selected').forEach(el => {
        selectedAttributes.push({
            attributeId: parseInt(el.dataset.attrId),
            attributeName: el.dataset.attrName,
            priceAdjustment: parseFloat(el.dataset.priceAdj)
        });
    });

    // Calculate final price
    let basePrice = product.discountPrice || product.basePrice;
    let totalAdjustment = selectedAttributes.reduce((sum, attr) => sum + attr.priceAdjustment, 0);
    let finalPrice = basePrice + totalAdjustment;

    // Add to cart
    const cartItem = {
        productId: product.productId,
        productName: product.name,
        quantity: quantity,
        unitPrice: finalPrice,
        totalPrice: finalPrice * quantity,
        selectedAttributes: selectedAttributes,
        image: product.images?.[0]?.imageUrl
    };

    // Check if product already in cart
    const existingIndex = appState.cart.findIndex(item =>
        item.productId === cartItem.productId &&
        JSON.stringify(item.selectedAttributes) === JSON.stringify(cartItem.selectedAttributes)
    );

    if (existingIndex >= 0) {
        appState.cart[existingIndex].quantity += quantity;
        appState.cart[existingIndex].totalPrice =
            appState.cart[existingIndex].unitPrice * appState.cart[existingIndex].quantity;
    } else {
        appState.cart.push(cartItem);
    }

    saveCartToStorage();
    updateCartBadge();

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();

    // Show success message
    showToast('Đã thêm vào giỏ hàng!');
}

// Show Cart
function showCart() {
    if (appState.cart.length === 0) {
        alert('Giỏ hàng trống');
        return;
    }

    const cartBody = document.getElementById('cartBody');
    const subtotal = appState.cart.reduce((sum, item) => sum + item.totalPrice, 0);

    cartBody.innerHTML = `
        <div class="table-responsive">
            <table class="table">
                <thead>
                    <tr>
                        <th>Sản phẩm</th>
                        <th>Đơn giá</th>
                        <th>Số lượng</th>
                        <th>Thành tiền</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    ${appState.cart.map((item, index) => `
                        <tr>
                            <td>
                                <div class="d-flex align-items-center">
                                    <img src="${item.image || 'https://via.placeholder.com/60'}" 
                                         style="width: 60px; height: 60px; object-fit: cover; margin-right: 10px;">
                                    <div>
                                        <div>${item.productName}</div>
                                        ${item.selectedAttributes.length > 0 ?
            `<small class="text-muted">${item.selectedAttributes.map(a => a.attributeName).join(', ')}</small>`
            : ''}
                                    </div>
                                </div>
                            </td>
                            <td>${formatPrice(item.unitPrice)}</td>
                            <td>${item.quantity}</td>
                            <td class="fw-bold">${formatPrice(item.totalPrice)}</td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        <div class="text-end">
            <h4>Tổng cộng: <span class="text-primary">${formatPrice(subtotal)}</span></h4>
        </div>
    `;

    const modal = new bootstrap.Modal(document.getElementById('cartModal'));
    modal.show();
}

// Remove from cart
function removeFromCart(index) {
    appState.cart.splice(index, 1);
    saveCartToStorage();
    updateCartBadge();
    showCart();
}

// Proceed to Checkout (FACADE PATTERN)
function proceedToCheckout() {
    if (appState.cart.length === 0) {
        alert('Giỏ hàng trống');
        return;
    }

    // Show checkout form modal
    showCheckoutForm();
}

// Show Checkout Form Modal
function showCheckoutForm() {
    const modalHtml = `
        <div class="modal fade" id="checkoutModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Thông tin thanh toán</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="checkoutForm">
                            <div class="mb-3">
                                <label class="form-label">Họ và tên *</label>
                                <input type="text" class="form-control" id="shippingFullName" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Số điện thoại *</label>
                                <input type="tel" class="form-control" id="shippingPhone" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Địa chỉ *</label>
                                <input type="text" class="form-control" id="shippingAddress" required>
                            </div>
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Thành phố</label>
                                    <input type="text" class="form-control" id="shippingCity" placeholder="TP.HCM">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Quận/Huyện</label>
                                    <input type="text" class="form-control" id="shippingDistrict">
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Phường/Xã</label>
                                    <input type="text" class="form-control" id="shippingWard">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Phương thức thanh toán</label>
                                <select class="form-select" id="paymentMethod">
                                    <option value="COD">Thanh toán khi nhận hàng (COD)</option>
                                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ghi chú</label>
                                <textarea class="form-control" id="notes" rows="3"></textarea>
                            </div>
                            <div class="alert alert-info">
                                <strong>Tổng tiền:</strong> <span id="checkoutTotal">0đ</span>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                        <button type="button" class="btn btn-primary" onclick="submitCheckout()">
                            <i class="fas fa-check"></i> Đặt hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('checkoutModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Calculate total
    const total = appState.cart.reduce((sum, item) => sum + item.totalPrice, 0);
    document.getElementById('checkoutTotal').textContent = formatPrice(total);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
    modal.show();
}

// Submit Checkout (FACADE PATTERN - calls API)
async function submitCheckout() {
    const form = document.getElementById('checkoutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect shipping info
    const shippingInfo = {
        fullName: document.getElementById('shippingFullName').value,
        phone: document.getElementById('shippingPhone').value,
        address: document.getElementById('shippingAddress').value,
        city: document.getElementById('shippingCity').value || null,
        district: document.getElementById('shippingDistrict').value || null,
        ward: document.getElementById('shippingWard').value || null
    };

    // Transform cart items to OrderItemDto format
    const items = appState.cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        selectedAttributeIds: item.selectedAttributes?.map(attr => attr.attributeId) || []
    }));

    // Build request payload
    const checkoutRequest = {
        userId: 1, // In real app, get from auth context
        shippingInfo: shippingInfo,
        items: items,
        shippingMethodId: null, // Will be calculated by backend
        paymentMethod: document.getElementById('paymentMethod').value,
        notes: document.getElementById('notes').value || null
    };

    try {
        // Show loading
        const submitBtn = event.target;
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';

        // Call API (FACADE PATTERN)
        const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkoutRequest)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Success
            bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
            
            // Clear cart
            appState.cart = [];
            saveCartToStorage();
            updateCartBadge();

            // Show success message
            showToast(`Đặt hàng thành công! Mã đơn hàng: ${result.orderNumber}`);
            
            // In real app, redirect to order confirmation page
            console.log('Order created:', result);
        } else {
            // Error
            throw new Error(result.error || 'Đặt hàng thất bại');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Lỗi: ' + error.message);
    } finally {
        // Restore button
        const submitBtn = event.target;
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check"></i> Đặt hàng';
    }
}

// Helper Functions
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

function updateCartBadge() {
    const count = appState.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function saveCartToStorage() {
    localStorage.setItem('furnitureCart', JSON.stringify(appState.cart));
}

function loadCartFromStorage() {
    const saved = localStorage.getItem('furnitureCart');
    if (saved) {
        appState.cart = JSON.parse(saved);
        updateCartBadge();
    }
}

function scrollToProducts() {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = '9999';
    toast.innerHTML = `
        <div class="alert alert-success alert-dismissible fade show">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function loadCategoryProducts(categoryId) {
    try {
        const response = await fetch(`${API_BASE_URL}/products/category/${categoryId}`);
        const products = await response.json();
        displayProducts(products);
        scrollToProducts();
    } catch (error) {
        console.error('Error loading category products:', error);
    }
}