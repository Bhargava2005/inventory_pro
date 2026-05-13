import api from './client.js';

export const employeeAPI = {
  getBehavior: (params) => api.get('/employees/behavior', { params }),
  getDetail: (id, params) => api.get(`/employees/${id}/detail`, { params }),
  exportExcel: (body) =>
    api.post('/employees/export', body, { responseType: 'blob', timeout: 30000 }),
};
