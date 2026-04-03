import api from './api';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const logout = () =>
  api.post('/auth/logout');

export const signup = (formData) =>
  api.post('/auth/signup', formData);

export const getMyInfo = (token = null) => {
  return api.get('/members/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
};
