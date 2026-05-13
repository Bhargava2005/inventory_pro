import API from './client.js';

export const announcementAPI = {
  create: (data) => API.post('/announcements', data),
  getActive: () => API.get('/announcements/active'),
  getAll: () => API.get('/announcements'),
  delete: (id) => API.delete(`/announcements/${id}`),
};
