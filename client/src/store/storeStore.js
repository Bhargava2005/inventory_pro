import { create } from 'zustand';
import { storeAPI } from '../api/stores.js';

const useStoreStore = create((set) => ({
  stores: [],
  isLoading: false,
  error: null,

  fetchStores: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await storeAPI.getAll();
      set({ stores: data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createStore: async (storeData) => {
    try {
      const { data } = await storeAPI.create(storeData);
      set((state) => ({ stores: [...state.stores, data.data] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  updateStore: async (id, storeData) => {
    try {
      const { data } = await storeAPI.update(id, storeData);
      set((state) => ({
        stores: state.stores.map((s) => (s._id === id ? data.data : s)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deactivateStore: async (id) => {
    try {
      await storeAPI.remove(id);
      set((state) => ({
        stores: state.stores.map((s) => (s._id === id ? { ...s, isActive: false } : s)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useStoreStore;
