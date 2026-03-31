import { createContext, useContext, useState, useEffect } from 'react';
import { setToken, removeToken, isAuthenticated, getToken } from '../utils/auth';
import * as authApi from '../api/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. 내 정보 조회 (토큰을 인자로 받거나 스토리지에서 가져옴)
  const fetchMyInfo = async (token = null) => {
    try {
      const currentToken = token || getToken();

      // 토큰이 없거나 "undefined" 문자열이면 중단
      if (!currentToken || currentToken === 'undefined') {
        setLoading(false);
        return;
      }

      const response = await authApi.getMyInfo(currentToken);
      // 백엔드 공통 응답 구조(data.data) 대응
      const userData = response.data.data || response.data;
      setUser(userData);
    } catch (error) {
      console.error('내 정보 조회 실패:', error);
      // 401(인증만료) 시에만 클라이언트 정보 정리
      if (error.response?.status === 401) {
        removeToken();
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. 로그인
  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);
      const data = response.data.data || response.data;
      const accessToken = data.accessToken;

      if (accessToken) {
        setToken(accessToken);
        // 로그인 직후 Axios 헤더 반영 전일 수 있으므로 토큰 직접 전달
        await fetchMyInfo(accessToken);
        return true;
      }
      return false;
    } catch (error) {
      // 여기서 throw를 해야 LoginPage의 catch문에서 에러 메시지를 잡을 수 있습니다.
      throw error;
    }
  };

  // 3. 로그아웃 (백엔드 연동 포함)
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('백엔드 로그아웃 처리 중 오류:', error);
    } finally {
      // 에러가 나더라도 클라이언트 상태는 무조건 정리
      removeToken();
      setUser(null);
    }
  };

  // 4. 앱 초기 실행 시 로그인 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        await fetchMyInfo();
      } else {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMyInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);