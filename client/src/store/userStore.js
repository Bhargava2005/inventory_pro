import { create } from 'zustand';
import { userAPI } from '../api/users.js';

const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { data } = await userAPI.getAll(params);
      set({ users: data.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  createUser: async (userData) => {
    try {
      const { data } = await userAPI.create(userData);
      set((state) => ({ users: [...state.users, data.data] }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Error creating user' };
    }
  },

  updateUser: async (id, userData) => {
    try {
      const { data } = await userAPI.update(id, userData);
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? data.data : u)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  deactivateUser: async (id) => {
    try {
      await userAPI.remove(id);
      set((state) => ({
        users: state.users.map((u) => (u._id === id ? { ...u, isActive: false } : u)),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },
}));

export default useUserStore;
