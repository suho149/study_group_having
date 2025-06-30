import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://having.duckdns.org';

export const checkAuthStatus = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('토큰이 없습니다.');
      return false;
    }

    const response = await axios.get(`${API_BASE_URL}/api/auth/validate`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return response.status === 200;
  } catch (error) {
    console.error('토큰 검증 실패:', error);
    localStorage.clear(); // 유효하지 않은 토큰이면 로컬 스토리지 초기화
    return false;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string) => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = () => {
  localStorage.removeItem('token');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
}; 