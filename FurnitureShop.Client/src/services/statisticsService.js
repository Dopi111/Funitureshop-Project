import apiClient from "../utils/apiClient";

export const statisticsService = {
    async getDashboardData(startDate = null, endDate = null) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const query = params.toString() ? `?${params.toString()}` : '';
        return apiClient.get(`/statistics/dashboard${query}`);
    },
};
