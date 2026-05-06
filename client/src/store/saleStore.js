import { create } from 'zustand';
import { saleAPI } from '../api/sales.js';

const useSaleStore = create((set, get) => ({
  sales: [],
  stats: null,
  isLoading: false,
  isSubmitting: false,

  fetchSales: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await saleAPI.getAll(params);
      set({ sales: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await saleAPI.getStats();
      set({ stats: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  processSale: async (saleData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await saleAPI.create(saleData);
      set({ isSubmitting: false });
      return { success: true, data: data.data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.response?.data?.message || 'Checkout failed' };
    }
  },
}));

export default useSaleStore;
