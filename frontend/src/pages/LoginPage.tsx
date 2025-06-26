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
    // const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
    // window.location.href = `${API_BASE_URL}/oauth2/authorization/google`;
    // 1. 프론트엔드의 현재 주소를 기준으로 리디렉션 될 최종 경로를 만듭니다.
    const redirectUriAfterLogin = `${window.location.origin}/oauth2/redirect`;

    // 2. 백엔드의 로그인 시작 URL에, 위에서 만든 경로를 'redirect_uri' 파라미터로 추가합니다.
    const googleLoginUrl = `http://having.duckdns.org:8080/oauth2/authorization/google?redirect_uri=${encodeURIComponent(redirectUriAfterLogin)}`;

    // 3. 이 최종 URL로 이동합니다.
    window.location.href = googleLoginUrl;
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