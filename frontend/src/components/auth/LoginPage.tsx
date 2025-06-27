import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 4 }}>
          스터디 그룹에 오신 것을 환영합니다
        </Typography>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          sx={{
            backgroundColor: '#fff',
            color: '#757575',
            '&:hover': {
              backgroundColor: '#f5f5f5',
            },
            width: '100%',
            py: 1.5,
            mb: 2,
            border: '1px solid #ddd',
          }}
        >
          Google 계정으로 로그인
        </Button>
      </Box>
    </Container>
  );
};

export default LoginPage; 