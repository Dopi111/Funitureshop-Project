/**
 * Product Service
 */

import apiClient from "../utils/apiClient";

export const productService = {
    /**
     * Get all products with pagination
     */
    async getProducts(params = {}) {
        const qs = apiClient.buildQueryString(params);
        return apiClient.get(`/products?${qs}`);
    },

    /**
     * Get product by ID
     */
    async getProductById(id) {
        return apiClient.get(`/products/${id}`);
    },

    /**
     * Get all categories
     */
    async getCategories() {
        return apiClient.get('/categories');
    },

    // ========== PRODUCT TYPES ==========

    /**
     * Get available product types
     */
    async getProductTypes() {
        return apiClient.get('/product-types');
    },

    /**
     * Validate product by type
     */
    async validateProductType(request) {
        return apiClient.post('/product-types/validate', request);
    },

    /**
     * Get product type statistics
     */
    async getProductTypeStats() {
        return apiClient.get('/product-types/stats');
    },
};

export default productService;
