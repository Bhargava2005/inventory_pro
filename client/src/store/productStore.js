import { create } from 'zustand';
import { productAPI } from '../api/products.js';

const useProductStore = create((set, get) => ({
  products: [],
  categories: [],
  brands: [],
  stats: null,
  total: 0,
  totalPages: 1,
  page: 1,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  filters: { search: '', category: 'all', sort: '-createdAt', status: '', branchId: '' },

  setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters }, page: 1 })),
  setPage: (page) => set({ page }),

  // ── Products ──────────────────────────────────────────────────────────────
  fetchProducts: async (overrideParams = {}) => {
    set({ isLoading: true });
    try {
      const { filters, page } = get();
      const params = { ...filters, page: 1, limit: 12, ...overrideParams };
      if (overrideParams.page) params.page = overrideParams.page;
      
      if (!params.status) delete params.status;
      if (params.category === 'all') delete params.category;
      if (params.brand === 'all') delete params.brand;
      
      const { data } = await productAPI.getAll(params);
      set({
        products: data.data,
        total: data.total,
        totalPages: data.totalPages || 1,
        page: params.page,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMoreProducts: async (overrideParams = {}) => {
    const { products, page, totalPages, isLoadingMore, isLoading } = get();
    if (page >= totalPages || isLoadingMore || isLoading) return;
    
    set({ isLoadingMore: true });
    try {
      const nextPage = page + 1;
      const { filters } = get();
      const params = { ...filters, page: nextPage, limit: 12, ...overrideParams };
      
      if (!params.status) delete params.status;
      if (params.category === 'all') delete params.category;
      if (params.brand === 'all') delete params.brand;
      
      const { data } = await productAPI.getAll(params);
      set({
        products: [...products, ...data.data],
        page: nextPage,
        isLoadingMore: false,
      });
    } catch {
      set({ isLoadingMore: false });
    }
  },

  fetchStats: async (params = {}) => {
    try {
      const { filters } = get();
      const queryParams = { ...filters, ...params };
      if (!queryParams.branchId) delete queryParams.branchId;
      const { data } = await productAPI.getStats(queryParams);
      set({ stats: data.data });
    } catch {}
  },

  createProduct: async (productData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await productAPI.create(productData);
      await get().fetchProducts();
      await get().fetchStats();
      set({ isSubmitting: false });
      return { success: true, data: data.data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.message };
    }
  },

  updateProduct: async (id, productData) => {
    set({ isSubmitting: true });
    try {
      const { data } = await productAPI.update(id, productData);
      await get().fetchProducts();
      await get().fetchStats();
      set({ isSubmitting: false });
      return { success: true, data: data.data };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.message };
    }
  },

  deleteProduct: async (id) => {
    try {
      await productAPI.remove(id);
      await get().fetchProducts();
      await get().fetchStats();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  adjustStock: async (id, adjustment, type = 'set') => {
    try {
      await productAPI.adjustStock(id, { adjustment, type });
      await get().fetchProducts();
      await get().fetchStats();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // ── Categories ────────────────────────────────────────────────────────────
  fetchCategories: async () => {
    try {
      const { data } = await productAPI.getCategories();
      set({ categories: data.data });
    } catch {}
  },
  
  fetchBrands: async (params = {}) => {
    try {
      const { data } = await productAPI.getBrands(params);
      set({ brands: data.data });
    } catch {}
  },

  createCategory: async (categoryData) => {
    set({ isSubmitting: true });
    try {
      await productAPI.createCategory(categoryData);
      await get().fetchCategories();
      set({ isSubmitting: false });
      return { success: true };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.message };
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ isSubmitting: true });
    try {
      await productAPI.updateCategory(id, categoryData);
      await get().fetchCategories();
      set({ isSubmitting: false });
      return { success: true };
    } catch (error) {
      set({ isSubmitting: false });
      return { success: false, message: error.message };
    }
  },

  deleteCategory: async (id) => {
    try {
      await productAPI.deleteCategory(id);
      await get().fetchCategories();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useProductStore;
