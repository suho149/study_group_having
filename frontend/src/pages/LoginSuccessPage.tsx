import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';

// 쿠키에서 특정 이름의 값을 읽어오는 헬퍼 함수
const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
    }
    return null;
};

const LoginSuccessPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // 이 페이지는 직접 쿠키를 읽지 않습니다.
        // 대신 AuthContext의 checkAuth가 로컬 스토리지에 토큰이 없음을 확인하고,
        // 서버에 /api/users/me 같은 요청을 보낼 때, 브라우저가 자동으로 쿠키를 포함시켜 보냅니다.
        // 하지만 더 명시적인 방법은, 이 페이지가 로드되자마자 부모 창에 메시지를 보내는 것입니다.

        // 이 페이지는 "로그인 성공!" 이라는 신호를 보내는 역할만 하고,
        // 실제 로그인 처리는 메인 윈도우의 AuthContext가 담당하도록 할 수 있습니다.
        // 또는, 이 페이지가 로드된 후 메인 페이지로 이동하면,
        // AuthContext의 checkAuth가 쿠키를 포함한 API 요청을 보내고 로그인 상태를 갱신합니다.

        // 가장 간단한 방법: checkAuth를 호출하여 상태를 갱신하고, 메인으로 이동
        const processLogin = async () => {
            // 쿠키가 설정될 시간을 약간 기다립니다.
            await new Promise(resolve => setTimeout(resolve, 100));
            await login(); // 수정: login 함수가 이제 토큰 없이 상태를 갱신한다고 가정
            navigate('/');
        };

        processLogin();

    }, [login, navigate]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh'}}>
            <CircularProgress />
            <Typography sx={{mt: 2}}>로그인 처리 중입니다...</Typography>
        </Box>
    );
};

export default LoginSuccessPage;