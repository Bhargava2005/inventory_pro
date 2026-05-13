import api from './client.js';

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
};
