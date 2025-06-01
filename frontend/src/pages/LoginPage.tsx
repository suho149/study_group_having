import React from 'react';
import { Box, Container, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import GoogleIcon from '@mui/icons-material/Google';

const LoginContainer = styled(Paper)({
  padding: '40px',
  borderRadius: '12px',
  maxWidth: '400px',
  margin: '80px auto',
  textAlign: 'center',
});

const LoginTitle = styled(Typography)({
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '32px',
  color: '#333',
});

const LoginButton = styled(Button)({
  width: '100%',
  padding: '12px',
  marginBottom: '16px',
  borderRadius: '8px',
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
  },
});

const GoogleLoginButton = styled(LoginButton)({
  backgroundColor: '#fff',
  color: '#666',
  border: '1px solid #ddd',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
});

const KakaoLoginButton = styled(LoginButton)({
  backgroundColor: '#FEE500',
  color: '#000',
  '&:hover': {
    backgroundColor: '#FDD835',
  },
});

const LoginPage = () => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8080/oauth2/authorization/google';
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 엔드포인트는 나중에 추가
    window.location.href = 'http://localhost:8080/oauth2/authorization/kakao';
  };

  return (
    <Container>
      <LoginContainer elevation={1}>
        <LoginTitle>Having에 오신 것을 환영합니다</LoginTitle>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            소셜 계정으로 간편하게 로그인하세요
          </Typography>
        </Box>
        <GoogleLoginButton
          onClick={handleGoogleLogin}
          startIcon={<GoogleIcon />}
        >
          Google 계정으로 계속하기
        </GoogleLoginButton>
        <KakaoLoginButton
          onClick={handleKakaoLogin}
          startIcon={
            <img 
              src="/images/kakao-icon.png" 
              alt="Kakao"
              style={{ width: '20px', height: '20px', marginRight: '8px' }}
            />
          }
        >
          카카오 계정으로 계속하기
        </KakaoLoginButton>
      </LoginContainer>
    </Container>
  );
};

export default LoginPage; 