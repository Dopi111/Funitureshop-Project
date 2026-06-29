import apiClient from '../utils/apiClient';

export const behaviorService = {
  async getTopViewed(topN = 10, days = 7) {
    const r = await apiClient.get(`/statistics/products/top-viewed?topN=${topN}&days=${days}`);
    return r.success ? (r.data?.data ?? r.data ?? []) : [];
  },
  async getClickToSale(topN = 20, days = 30) {
    const r = await apiClient.get(`/statistics/products/click-to-sale?topN=${topN}&days=${days}`);
    return r.success ? (r.data?.data ?? r.data ?? []) : [];
  },
  async getDailyViewsTotal(days = 30) {
    const r = await apiClient.get(`/statistics/products/daily-views-total?days=${days}`);
    return r.success ? (r.data?.data ?? r.data ?? []) : [];
  },
};
