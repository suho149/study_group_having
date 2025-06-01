import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIsLoggedIn, checkAuth } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // AuthContext의 checkAuth 함수를 호출하여 사용자 ID 설정
      checkAuth();
      setIsLoggedIn(true);
      navigate('/');
    } else if (error) {
      navigate('/login?error=' + error);
    }
  }, [navigate, searchParams, setIsLoggedIn, checkAuth]);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  );
};

export default OAuth2RedirectHandler; 