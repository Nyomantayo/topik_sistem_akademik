import api from './api'

export const authService = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  guestLogin:     ()     => api.post('/auth/guest'),
  profile:        ()     => api.get('/auth/profile'),
  updateProfile:  (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
}
