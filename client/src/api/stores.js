import api from './client.js';

export const storeAPI = {
  getAll: () => api.get('/stores'),
  getOne: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  remove: (id) => api.delete(`/stores/${id}`),
};
