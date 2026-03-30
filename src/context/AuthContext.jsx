import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, removeToken, isAuthenticated } from '../utils/auth';
import api from '../api/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
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

  const logout = () => {
    removeToken();
    setUser(null);
  };

  const fetchMyInfo = async () => {
    try {
      const response = await api.get('/members/me');
      setUser(response.data);
    } catch (error) {
      console.error('내 정보 조회 실패:', error);
      logout();
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
