import React, { createContext, useContext, useState, useEffect } from 'react';
import { checkAuthStatus } from '../services/auth';

interface AuthContextType {
  isLoggedIn: boolean;
  setIsLoggedIn: (value: boolean) => void;
  currentUserId: number | null;
  setCurrentUserId: (value: number | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT 토큰에서 사용자 ID를 추출하는 함수
const extractUserIdFromToken = (token: string): number | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    console.log('토큰 페이로드:', payload);
    // sub 필드에서 ID를 추출 (Spring Security OAuth2에서는 보통 sub 필드에 사용자 ID를 저장)
    const userId = payload.sub || payload.id;
    console.log('추출된 사용자 ID:', userId);
    return Number(userId);
  } catch (error) {
    console.error('토큰 파싱 에러:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const token = localStorage.getItem('token');
    return !!token;
  });
  
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userId = extractUserIdFromToken(token);
      console.log('초기 사용자 ID:', userId);
      return userId;
    }
    return null;
  });

  const checkAuth = async () => {
    const isValid = await checkAuthStatus();
    console.log('인증 상태 확인:', isValid);
    setIsLoggedIn(isValid);
    
    if (isValid) {
      const token = localStorage.getItem('token');
      if (token) {
        const userId = extractUserIdFromToken(token);
        console.log('checkAuth에서 설정된 사용자 ID:', userId);
        setCurrentUserId(userId);
      }
    } else {
      setCurrentUserId(null);
    }
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // 토큰 변경 감지
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userId = extractUserIdFromToken(token);
      console.log('토큰 변경 감지에서 설정된 사용자 ID:', userId);
      setCurrentUserId(userId);
      setIsLoggedIn(true);
    } else {
      setCurrentUserId(null);
      setIsLoggedIn(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setIsLoggedIn(false);
    setCurrentUserId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      isLoggedIn, 
      setIsLoggedIn, 
      currentUserId, 
      setCurrentUserId,
      checkAuth,
      logout
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