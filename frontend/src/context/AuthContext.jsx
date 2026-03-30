import { createContext, useContext, useState, useEffect } from 'react';
import { setToken, removeToken, isAuthenticated } from '../utils/auth';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const { accessToken } = response.data;
      setToken(accessToken);
      // 로그인 성공 시 내 정보 가져오기
      await fetchMyInfo();
      return true;
    } catch (error) {
      console.error('로그인 실패:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('백엔드 로그아웃 실패:', error);
    } finally {
      removeToken();
      setUser(null);
    }
  };

  const fetchMyInfo = async () => {
    try {
      const response = await authApi.getMyInfo();
      setUser(response.data);
    } catch (error) {
      console.error('내 정보 조회 실패:', error);
      removeToken();
      setUser(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      fetchMyInfo().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMyInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
