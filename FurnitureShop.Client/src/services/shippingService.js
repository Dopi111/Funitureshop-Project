/**
 * Shipping Service
 */

import apiClient from "../utils/apiClient";

export const shippingService = {
    /**
     * Get available shipping options
     */
    async getOptions(productIds, shippingInfo) {
        return apiClient.post('/shipping/options', {
            productIds,
            shippingInfo,
        });
    },

    /**
     * Calculate best shipping option
     */
    async calculateBest(request) {
        return apiClient.post('/shipping/calculate-best', request);
    },

    /**
     * Calculate all shipping options
     */
    async calculateAll(request) {
        return apiClient.post('/shipping/calculate-all', request);
    },
};

export default shippingService;
