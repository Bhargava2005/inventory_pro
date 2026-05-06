import api from './client.js';

export const saleAPI = {
  create: (data) => api.post('/sales', data),
  getAll: (params) => api.get('/sales', { params }),
  getStats: () => api.get('/sales/stats'),
};
