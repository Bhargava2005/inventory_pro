import { create } from 'zustand';
import { saleAPI } from '../api/sales.js';
import { reportAPI } from '../api/reports.js';

const useSaleStore = create((set, get) => ({
  sales: [],
  stats: null,
  analysisData: null,
  isLoading: false,
  isSubmitting: false,

  // Pagination state
  page: 1,
  totalPages: 1,
  total: 0,

  fetchSales: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await saleAPI.getAll({ page: get().page, limit: 20, ...params });
      set({
        sales: data.data,
        total: data.total,
        totalPages: data.totalPages,
        page: data.page,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setPage: (page) => set({ page }),

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const { data } = await saleAPI.getStats();
      set({ stats: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchAnalysis: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await reportAPI.getAnalysis(params);
      set({ analysisData: data.data, isLoading: false });
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
  
  updateSaleItem: async (saleId, itemId, updateData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await saleAPI.updateItem(saleId, itemId, updateData);
      // Update the local sales array with the new sale data
      const updatedSales = get().sales.map(s => s._id === saleId ? data.data : s);
      set({ sales: updatedSales, isSubmitting: false });
      return { success: true, data: data.data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  },
}));

export default useSaleStore;
