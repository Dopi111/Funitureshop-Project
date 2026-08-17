import apiClient from '../utils/apiClient';

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const apiService = {
    async getProducts(params = {}) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`${API_BASE_URL}/products?${query}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },

    async getProductById(id) {
        const response = await fetch(`${API_BASE_URL}/products/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },

    async getCategories() {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    },

    // ========== CART API ==========
    async getCart(userId) {
        const response = await fetch(`${API_BASE_URL}/cart?userId=${userId}`);
        if (!response.ok) {
            throw new Error('Không thể tải giỏ hàng');
        }
        return response.json();
    },

    async addToCart(userId, productId, quantity = 1) {
        const response = await fetch(`${API_BASE_URL}/cart/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, productId, quantity })
        });
        return response.json();
    },

    async updateCartItem(userId, cartItemId, quantity) {
        const response = await fetch(`${API_BASE_URL}/cart/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, cartItemId, quantity })
        });
        return response.json();
    },

    async removeFromCart(userId, cartItemId) {
        const response = await fetch(`${API_BASE_URL}/cart/remove/${cartItemId}?userId=${userId}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    async clearCart(userId) {
        const response = await fetch(`${API_BASE_URL}/cart/clear?userId=${userId}`, {
            method: 'DELETE'
        });
        return response.json();
    },

    async getCartCount(userId) {
        const response = await fetch(`${API_BASE_URL}/cart/count?userId=${userId}`);
        return response.json();
    },

    // ========== PAYMENT API ==========
    async getPaymentMethods() {
        const response = await fetch(`${API_BASE_URL}/payments/methods`);
        if (!response.ok) throw new Error('Không thể tải phương thức thanh toán');
        return response.json();
    },

    async processPayment(paymentData) {
        const response = await fetch(`${API_BASE_URL}/payments/process`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        return response.json();
    },

    async createPaymentUrl(data) {
        const response = await fetch(`${API_BASE_URL}/payments/create-payment-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    // ========== ORDER API ==========
    async checkout(orderData) {
        const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        return response.json();
    },

    async getUserOrders(userId) {
        const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
        if (!response.ok) throw new Error('Không thể tải đơn hàng');
        return response.json();
    },

    async getOrderById(orderId) {
        const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);
        if (!response.ok) throw new Error('Không thể tải chi tiết đơn hàng');
        return response.json();
    },

    async getShippingOptions(data) {
        const response = await fetch(`${API_BASE_URL}/orders/shipping-options`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) return [];
        return response.json();
    },

    async calculateShippingBest(shippingInfo, items = []) {
        const isLocal = (shippingInfo?.city || '').toLowerCase().includes('hcm') || (shippingInfo?.city || '').toLowerCase().includes('hồ chí minh');
        const isRegional = ['binh duong', 'dong nai', 'long an', 'can tho', 'an giang'].some(c => (shippingInfo?.city || '').toLowerCase().includes(c));
        
        const payload = {
            destinationCity: shippingInfo?.city || 'TP.HCM',
            destinationDistrict: shippingInfo?.district || 'Quan 1',
            totalWeight: items.reduce((sum, item) => sum + (item.weight ?? 5) * item.quantity, 0) || 10,
            totalVolume: items.reduce((sum, item) => sum + (item.volume ?? 0.2) * item.quantity, 0) || 0.5,
            distance: isLocal ? 10 : isRegional ? 60 : 500,
            itemCount: items.length || 1
        };

        const response = await fetch(`${API_BASE_URL}/shipping/calculate-best`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) return null;
        return response.json();
    },

    async getPriceBreakdown(data) {
        const response = await fetch(`${API_BASE_URL}/orders/price-breakdown`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) return null;
        return response.json();
    },

    // ========== USER PROFILE API ==========
    async getProfile(userId) {
        const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
        if (!response.ok) throw new Error('Không thể tải thông tin tài khoản');
        return response.json();
    },

    async updateProfile(data) {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async changePassword(data) {
        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async sendOtpForContact(data) {
        const response = await fetch(`${API_BASE_URL}/auth/send-otp-contact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async updateContact(data) {
        const response = await fetch(`${API_BASE_URL}/auth/update-contact`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return response.json();
    },

    async request(endpoint, options = {}) {
        const requestOptions = { ...options };
        if (requestOptions.data !== undefined && requestOptions.body === undefined) {
            requestOptions.body = requestOptions.data;
        }
        delete requestOptions.data;
        return apiClient.request(endpoint, requestOptions);
    }
};

export default apiService;
