import { jwtDecode } from 'jwt-decode';

export const setToken = (token) => {
  sessionStorage.setItem('accessToken', token);
};

export const getToken = () => {
  return sessionStorage.getItem('accessToken');
};

export const removeToken = () => {
  sessionStorage.removeItem('accessToken');
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  
  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const getMemberIdFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.sub; // 보통 sub에 memberId가 들어감
  } catch (error) {
    return null;
  }
};
