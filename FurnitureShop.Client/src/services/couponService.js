import apiClient from "../utils/apiClient";

export const couponService = {
    async getAllCoupons() {
        return apiClient.get('/coupons');
    },

    async createCoupon(data) {
        return apiClient.post('/coupons', data);
    },

    async updateCoupon(id, data) {
        return apiClient.put(`/coupons/${id}`, data);
    },

    async deleteCoupon(id) {
        return apiClient.delete(`/coupons/${id}`);
    }
};

export default couponService;
