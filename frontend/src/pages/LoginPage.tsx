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

    // // 1. 최종 도착지(로그인 성공 후 돌아올 곳)를 현재 도메인 기준으로 정합니다.
    // const redirectUriAfterLogin = `${window.location.origin}/oauth2/redirect`;
    //
    // // 2. 백엔드의 로그인 시작점은 상대 경로로 지정합니다.
    // const googleLoginUrl = `/oauth2/authorization/google`;
    //
    // // 3. 두 정보를 합쳐서 최종 URL을 만듭니다.
    // window.location.href = `${googleLoginUrl}?redirect_uri=${encodeURIComponent(redirectUriAfterLogin)}`;

    // 이제 3000번 포트가 없으므로 window.location.origin을 그대로 사용해도 됨
    const redirectUriAfterLogin = `${window.location.origin}/oauth2/redirect`;
    const googleLoginUrl = `/oauth2/authorization/google`;
    window.location.href = `${googleLoginUrl}?redirect_uri=${encodeURIComponent(redirectUriAfterLogin)}`;
  };

  const handleKakaoLogin = () => {
    // 카카오 로그인 엔드포인트는 나중에 추가
    const redirectUri = `${window.location.origin}/oauth2/redirect`;
    const kakaoLoginUrl = `/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = kakaoLoginUrl;
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