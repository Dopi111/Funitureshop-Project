/**
 * Order Service - Centralized order-related API calls
 * All requests go through apiClient for consistent auth & error handling
 */

import apiClient from "../utils/apiClient";

export const orderService = {
    /**
     * Get all orders with pagination and filtering
     */
    async getAllOrders(page = 1, pageSize = 10, statusFilter = null) {
        const params = { page, pageSize };
        if (statusFilter) {
            params.status = statusFilter;
        }
        const qs = apiClient.buildQueryString(params);
        return apiClient.get(`/orders?${qs}`);
    },

    /**
     * Get orders for a specific user
     */
    async getUserOrders(userId) {
        return apiClient.get(`/orders/user/${userId}`);
    },

    /**
     * Get order detail by ID
     */
    async getOrderById(orderId) {
        return apiClient.get(`/orders/${orderId}`);
    },

    /**
     * Create/checkout order
     */
    async checkout(orderData) {
        return apiClient.post('/orders/checkout', orderData);
    },

    // ========== ORDER COMMAND ENDPOINTS ==========

    /**
     * Confirm pending order
     */
    async confirmOrder(orderId, changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/confirm`, {
            changedBy,
        });
    },

    /**
     * Ship order (mark as shipped)
     */
    async shipOrder(orderId, changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/ship`, {
            changedBy,
        });
    },

    /**
     * Complete order (mark as completed)
     */
    async completeOrder(orderId, changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/complete`, {
            changedBy,
        });
    },

    /**
     * Transition order to next state generically
     */
    async transitionState(orderId, notes = '', changedBy = 'System') {
        return apiClient.post(`/orders/${orderId}/next-state`, {
            notes,
            changedBy,
        });
    },

    /**
     * Approve return request
     */
    async approveReturn(orderId, notes = '', changedBy = 'System') {
        return apiClient.post(`/orders/${orderId}/approve-return`, {
            notes,
            changedBy,
        });
    },

    /**
     * Cancel order
     */
    async cancelOrder(orderId, reason = '', changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/cancel`, {
            reason,
            changedBy,
        });
    },

    /**
     * Mark order as paid
     */
    async markOrderAsPaid(orderId, changedBy = 'System') {
        return apiClient.patch(`/order-commands/${orderId}/mark-paid`, {
            changedBy,
        });
    },

    /**
     * Undo last command
     */
    async undoCommand(orderId, changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/undo`, {
            changedBy,
        });
    },

    /**
     * Redo last undone command
     */
    async redoCommand(orderId, changedBy = 'System') {
        return apiClient.post(`/order-commands/${orderId}/redo`, {
            changedBy,
        });
    },

    /**
     * Update shipping address for order
     */
    async updateShippingAddress(orderId, shippingInfo, changedBy = 'System') {
        return apiClient.put(`/order-commands/${orderId}/shipping-address`, {
            ...shippingInfo,
            changedBy,
        });
    },

    // ========== ORDER STATE ENDPOINTS ==========

    /**
     * Get current order state with description and available transitions
     */
    async getOrderState(orderId) {
        return apiClient.get(`/order-state/${orderId}`);
    },

    /**
     * Get available transitions for current order status
     */
    async getAvailableTransitions(orderId) {
        return apiClient.get(`/order-state/${orderId}/available-transitions`);
    },

    /**
     * Get description of current order state
     */
    async getStateDescription(orderId) {
        return apiClient.get(`/order-state/${orderId}/description`);
    },

    // ========== ORDER WORKFLOW ENDPOINTS ==========

    /**
     * Get status history of order
     * Returns array: { historyId, fromStatus, toStatus, notes, changedBy, createdAt }
     */
    async getStatusHistory(orderId) {
        return apiClient.get(`/order-workflow/${orderId}/status-history`);
    },

    /**
     * Get workflow transitions and current status
     */
    async getWorkflowTransitions(orderId) {
        return apiClient.get(`/order-workflow/${orderId}/transitions`);
    },

    /**
     * Get static workflow rules (status transition rules)
     */
    async getWorkflowRules() {
        return apiClient.get('/order-workflow/rules');
    },

    // ========== SHIPPING ENDPOINTS ==========

    /**
     * Get shipping options for given products and address
     */
    async getShippingOptions(productIds, shippingInfo) {
        return apiClient.post('/shipping/options', {
            productIds,
            shippingInfo,
        });
    },

    /**
     * Calculate best (cheapest/fastest) shipping option
     */
    async calculateBestShipping(shippingCalculationRequest) {
        return apiClient.post('/shipping/calculate-best', shippingCalculationRequest);
    },

    /**
     * Calculate all available shipping options
     */
    async calculateAllShipping(shippingCalculationRequest) {
        return apiClient.post('/shipping/calculate-all', shippingCalculationRequest);
    },

    // ========== OTHER ORDER ENDPOINTS ==========

    /**
     * Get price breakdown (including tax calculation)
     */
    async getPriceBreakdown(priceData) {
        return apiClient.post('/orders/price-breakdown', priceData);
    },

    /**
     * Get shipping options (legacy endpoint support)
     * Redirects to shipping service
     */
    async getShippingOptionsFallback(data) {
        return apiClient.post('/orders/shipping-options', data);
    },
};

export default orderService;
