import api from './api';

// 로그인
export const login = (email, password) => 
  api.post('/auth/login', { email, password });

// 로그아웃
export const logout = () => 
  api.post('/auth/logout');

// 회원가입
export const signup = (formData) => 
  api.post('/auth/signup', formData);

// 내 정보 조회
export const getMyInfo = (token = null) => {
  // 로그인 직후에는 전달받은 token을 우선 사용
  return api.get('/members/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};