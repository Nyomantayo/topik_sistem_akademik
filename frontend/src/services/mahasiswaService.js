import api from './api'

export const mahasiswaService = {
  getAll:   (params) => api.get('/mahasiswa', { params }),
  getMe:    ()       => api.get('/mahasiswa/me'),
  getById:  (id)     => api.get(`/mahasiswa/${id}`),
  create:   (data)   => api.post('/mahasiswa', data),
  update:   (id, data) => api.put(`/mahasiswa/${id}`, data),
  delete:   (id)     => api.delete(`/mahasiswa/${id}`),
}
