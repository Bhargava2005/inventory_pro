import { create } from 'zustand';
import api from '../api/client.js';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/notifications');
      const unread = data.data.filter(n => !n.isRead).length;
      set({ notifications: data.data, unreadCount: unread, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set(state => {
        const updated = state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
        const unread = updated.filter(n => !n.isRead).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  },

  deleteNotification: async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      set(state => {
        const updated = state.notifications.filter(n => n._id !== id);
        const unread = updated.filter(n => !n.isRead).length;
        return { notifications: updated, unreadCount: unread };
      });
    } catch (error) {
      console.error('Failed to delete notification');
    }
  },

  clearNotifications: async () => {
    try {
      await api.delete('/notifications');
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to clear notifications');
    }
  },

  replyNotification: async (id, message) => {
    try {
      await api.post(`/notifications/${id}/reply`, { message });
      return true;
    } catch (error) {
      console.error('Failed to send reply');
      return false;
    }
  }
}));

export default useNotificationStore;
