import { create } from 'zustand';
import { branchAPI } from '../api/branches.js';

const useBranchStore = create((set) => ({
  branches: [],
  isLoading: false,
  error: null,

  fetchBranches: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await branchAPI.getAll();
      set({ branches: data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createBranch: async (branchData) => {
    try {
      const { data } = await branchAPI.create(branchData);
      set((state) => ({ branches: [...state.branches, data.data] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  updateBranch: async (id, branchData) => {
    try {
      const { data } = await branchAPI.update(id, branchData);
      set((state) => ({
        branches: state.branches.map((b) => (b._id === id ? data.data : b)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deactivateBranch: async (id) => {
    try {
      await branchAPI.remove(id);
      set((state) => ({
        branches: state.branches.map((b) => (b._id === id ? { ...b, isActive: false } : b)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useBranchStore;
