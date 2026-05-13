import api from './client.js';

export const reportAPI = {
  getInventoryExport: () => api.get('/reports/inventory/export', { responseType: 'blob' }),
  getSalesExport: (params) => api.get('/reports/sales/export', { params, responseType: 'blob' }),
  getAnalysis: (params) => api.get('/reports/analysis', { params }),
  getAnalysisExport: (params) => api.get('/reports/analysis/export', { params, responseType: 'blob' }),
};
