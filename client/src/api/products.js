import api from './client.js';

export const productAPI = {
  // Products
  getAll: (params) => api.get('/products', { params }),
  getStats: () => api.get('/products/stats'),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  adjustStock: (id, data) => api.patch(`/products/${id}/stock`, data),
  remove: (id) => api.delete(`/products/${id}`),

  // Categories
  getCategories: () => api.get('/categories'),
  getBrands: (params) => api.get('/products/brands', { params }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};
