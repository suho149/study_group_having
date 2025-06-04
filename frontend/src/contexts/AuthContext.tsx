import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { checkAuthStatus } from '../services/auth'; // 실제 경로 확인

// JWT 토큰에서 사용자 ID를 추출하는 함수
const extractUserIdFromToken = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null; // 토큰 형식이 잘못된 경우
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split('')
            .map(function (c) {
              return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );
    const payload = JSON.parse(jsonPayload);
    console.log('토큰 페이로드:', payload);
    // 'sub' (subject) 클레임이 표준 사용자 식별자. 없다면 'id' 또는 커스텀 클레임 확인.
    const userId = payload.sub || payload.id || payload.userId;
    console.log('추출된 사용자 ID:', userId);
    return userId ? Number(userId) : null;
  } catch (error) {
    console.error('토큰 파싱 에러:', error);
    return null;
  }
};

export interface AuthContextType {
  isLoggedIn: boolean;
  currentUserId: number | null;
  isLoading: boolean;
  checkAuth: () => Promise<void>; // 인증 상태 수동 갱신
  login: (token: string) => void; // 로그인 처리 (토큰만 받아도 ID 추출 가능)
  logout: () => void;
  // setIsLoggedIn, setCurrentUserId는 내부 관리용으로 숨기거나, 필요시 노출
  token?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // 초기 인증 상태 로딩 중 여부

  const handleAuthChange = (token: string | null) => {
    if (token) {
      const userId = extractUserIdFromToken(token);
      if (userId) {
        setIsLoggedIn(true);
        setCurrentUserId(userId);
        localStorage.setItem('token', token); // 로그인 성공 시 토큰 저장
      } else {
        // 토큰은 있지만 ID 추출 실패 (유효하지 않은 토큰 간주)
        setIsLoggedIn(false);
        setCurrentUserId(null);
        localStorage.removeItem('token');
      }
    } else {
      setIsLoggedIn(false);
      setCurrentUserId(null);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken'); // 리프레시 토큰도 관리한다면 제거
    }
  };

  const login = (token: string) => {
    console.log('로그인 시도, 토큰:', token);
    handleAuthChange(token);
  };

  const logout = () => {
    console.log('로그아웃 시도');
    handleAuthChange(null);
    // 필요 시 서버에 로그아웃 API 호출
    // 예: await api.post('/auth/logout');
  };

  const checkAuth = async () => {
    console.log('checkAuth 시작');
    setIsLoading(true);
    try {
      // 1. localStorage에 토큰이 있는지 먼저 확인
      const tokenFromStorage = localStorage.getItem('token');
      if (!tokenFromStorage) {
        console.log('localStorage에 토큰 없음, 로그아웃 상태');
        handleAuthChange(null);
        setIsLoading(false);
        return;
      }

      // 2. 서버에 토큰 유효성 검사 (checkAuthStatus가 이 역할을 한다고 가정)
      // checkAuthStatus는 토큰을 인자로 받거나, 내부적으로 localStorage에서 읽어서 검증할 수 있음
      const isValidOnServer = await checkAuthStatus(); // 또는 await checkAuthStatus(tokenFromStorage);
      console.log('서버 인증 상태 확인 결과:', isValidOnServer);

      if (isValidOnServer) {
        // 서버에서도 유효하면 해당 토큰으로 로그인 상태 유지
        handleAuthChange(tokenFromStorage);
      } else {
        // 서버에서 유효하지 않으면 로컬 토큰도 무효화 (로그아웃 처리)
        console.log('서버에서 토큰 무효 판정, 로그아웃 처리');
        handleAuthChange(null);
      }
    } catch (error) {
      console.error('인증 상태 확인 중 오류 발생:', error);
      // 오류 발생 시 안전하게 로그아웃 처리
      handleAuthChange(null);
    } finally {
      setIsLoading(false);
      console.log('checkAuth 종료, 현재 로그인 상태:', isLoggedIn, '사용자 ID:', currentUserId);
    }
  };

  useEffect(() => {
    checkAuth();

    // (선택 사항) 다른 탭/창에서의 localStorage 변경 감지
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token') {
        console.log('localStorage "token" 변경 감지, checkAuth 재실행');
        checkAuth(); // 토큰 변경 시 인증 상태 다시 확인
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // 마운트 시 1회 및 storage 이벤트 리스너 설정

  // 로딩 중일 때는 children 렌더링을 보류하거나 로딩 스피너 표시 가능
  if (isLoading) {
    // return <LoadingSpinner />; // 또는 null 이나 간단한 로딩 메시지
    // 초기 로딩 상태를 외부에 노출하고 싶다면 isLoading도 context value에 포함 가능
  }

  return (
      <AuthContext.Provider value={{
        isLoggedIn,
        currentUserId,
        isLoading,
        checkAuth,
        login,
        logout,
        // isLoading, // 필요 시
      }}>
        {children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};