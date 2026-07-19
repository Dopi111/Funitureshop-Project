import apiClient from '../utils/apiClient';

const unwrapList = (response) => {
  if (!response.success) throw new Error(response.message || 'Không thể tải dữ liệu hành vi');
  const data = response.data?.data ?? response.data ?? [];
  return Array.isArray(data) ? data : [];
};

export const behaviorService = {
  async getTopViewed(topN = 10, days = 7) {
    const r = await apiClient.get(`/statistics/products/top-viewed?topN=${topN}&days=${days}`);
    return unwrapList(r).map(item => ({
      ...item,
      productName: item.productName ?? item.name,
      totalViews: item.totalViews ?? item.viewCount ?? 0,
    }));
  },
  async getClickToSale(topN = 20, days = 30) {
    const query = apiClient.buildQueryString({ topN, days });
    const r = await apiClient.get(`/statistics/products/click-to-sale?${query}`);
    return unwrapList(r);
  },
  async getDailyViewsTotal(days = 30) {
    const r = await apiClient.get(`/statistics/products/daily-views-total?days=${days}`);
    return unwrapList(r);
  },
  async getDailyViews(days = 30) {
    return this.getDailyViewsTotal(days);
  },
};
