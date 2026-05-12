import api from './api'

export const dosenService = {
  getAll:              (params) => api.get('/dosen', { params }),
  getById:             (id)     => api.get(`/dosen/${id}`),
  getMahasiswaBimbingan: (id, params) => api.get(`/dosen/${id}/mahasiswa`, { params }),
  create:              (data)   => api.post('/dosen', data),
  update:              (id, data) => api.put(`/dosen/${id}`, data),
  delete:              (id)     => api.delete(`/dosen/${id}`),
}
