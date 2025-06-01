import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (token && refreshToken) {
      // 토큰을 로컬 스토리지에 저장
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      navigate('/');
    } else if (error) {
      navigate('/login?error=' + error);
    }
  }, [navigate, searchParams]);

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