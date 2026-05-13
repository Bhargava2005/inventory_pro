import { create } from 'zustand';
import api from '../api/client.js';

const useSettingsStore = create((set, get) => ({
  settings: null,
  isLoading: false,
  isUpdating: false,

  fetchSettings: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/settings');
      set({ settings: data.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      console.error('Failed to fetch settings:', error);
    }
  },

  updateSettings: async (settingsData) => {
    set({ isUpdating: true });
    try {
      const { data } = await api.put('/settings', settingsData);
      set({ settings: data.data, isUpdating: false });
      return { success: true, message: data.message };
    } catch (error) {
      set({ isUpdating: false });
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update settings' 
      };
    }
  },
}));

export default useSettingsStore;
