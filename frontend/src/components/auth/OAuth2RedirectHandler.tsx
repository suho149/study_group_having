import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext'; // 경로 확인

const OAuth2RedirectHandler = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // setIsLoggedIn 대신 login 함수를 가져옵니다.
  const { login, checkAuth } = useAuth(); // <-- 수정: setIsLoggedIn 제거, login 추가

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    if (token && refreshToken) {
      // localStorage에 토큰 저장 (login 함수 내부에서도 할 수 있지만, 여기서 명시적으로 해도 무방)
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // AuthContext의 login 함수를 호출하여 로그인 상태를 설정합니다.
      // login 함수는 내부적으로 토큰에서 사용자 ID를 추출하고, isLoggedIn을 true로 설정합니다.
        login();  // <--- 수정: setIsLoggedIn(true) 대신 login(token) 호출

      // checkAuth는 login 함수 호출 후 추가적으로 인증 상태를 검증하거나
      // 사용자 정보를 가져오는 데 사용할 수 있습니다.
      // login 함수가 이미 ID 추출 및 isLoggedIn 설정을 한다면 checkAuth는 생략 가능할 수도 있습니다.
      // 또는 login 후에 checkAuth를 호출하여 최신 상태를 보장할 수 있습니다.
      // await checkAuth(); // 필요하다면 호출

      navigate('/');
    } else if (error) {
      console.error('OAuth2 로그인 에러:', error);
      navigate(`/login?error=${encodeURIComponent(error)}`); // 에러 메시지 인코딩
    } else {
      // 토큰이나 에러 없이 리다이렉트된 경우 (비정상 상황)
      console.warn('OAuth2 리다이렉트 핸들러: 토큰이나 에러 파라미터가 없습니다.');
      navigate('/login?error=알 수 없는 오류가 발생했습니다.');
    }
    // useEffect 의존성 배열에서 setIsLoggedIn 제거, login 추가
  }, [navigate, searchParams, login, checkAuth]); // <--- 수정: 의존성 배열

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