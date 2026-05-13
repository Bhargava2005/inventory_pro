import { create } from 'zustand';
import { announcementAPI } from '../api/announcements.js';

const useAnnouncementStore = create((set, get) => ({
  activeAnnouncement: null,
  announcements: [],
  isLoading: false,

  fetchActiveAnnouncement: async () => {
    set({ isLoading: true });
    try {
      const { data } = await announcementAPI.getActive();
      set({ activeAnnouncement: data.data, isLoading: false });
    } catch (error) {
      console.error('fetchActiveAnnouncement Error:', error);
      set({ isLoading: false });
    }
  },

  fetchAnnouncements: async () => {
    set({ isLoading: true });
    try {
      const { data } = await announcementAPI.getAll();
      set({ announcements: data.data, isLoading: false });
    } catch (error) {
      console.error('fetchAnnouncements Error:', error);
      set({ isLoading: false });
    }
  },

  createAnnouncement: async (announcementData) => {
    set({ isLoading: true });
    try {
      const { data } = await announcementAPI.create(announcementData);
      set((state) => ({ 
        announcements: [data.data, ...state.announcements],
        activeAnnouncement: data.data,
        isLoading: false 
      }));
      return { success: true, message: 'Announcement published' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error.response?.data?.message || 'Failed to publish' };
    }
  },

  deleteAnnouncement: async (id) => {
    try {
      await announcementAPI.delete(id);
      set((state) => ({
        announcements: state.announcements.filter((a) => a._id !== id),
        activeAnnouncement: state.activeAnnouncement?._id === id ? null : state.activeAnnouncement,
      }));
      return { success: true, message: 'Announcement deleted' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete' };
    }
  },
}));

export default useAnnouncementStore;
