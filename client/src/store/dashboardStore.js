import { create } from 'zustand';
import { dashboardAPI } from '../api/dashboard.js';

const useDashboardStore = create((set) => ({
  summary: null,
  isLoading: false,
  error: null,

  fetchSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await dashboardAPI.getSummary();
      set({ summary: data.data, isLoading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch dashboard summary',
        isLoading: false 
      });
    }
  },
}));

export default useDashboardStore;
