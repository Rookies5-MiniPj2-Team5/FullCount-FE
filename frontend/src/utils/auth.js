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
    return decoded.sub; // sub에 memberId(Long)가 들어 있음
  } catch (error) {
    return null;
  }
};

/**
 * JWT 클레임에서 role 값을 읽어 반환합니다.
 * 백엔드 JwtProvider가 claim("role", role.name())으로 삽입합니다.
 * 예시 반환값: "ADMIN" | "USER" | null
 */
export const getRoleFromToken = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.role ?? null; // JwtProvider: .claim("role", role.name())
  } catch (error) {
    return null;
  }
};
