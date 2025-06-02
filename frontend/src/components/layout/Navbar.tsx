import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../../contexts/AuthContext'; // 경로가 올바른지 확인해주세요.

// Styled components는 그대로 사용합니다.
const StyledAppBar = styled(AppBar)({
  backgroundColor: '#fff',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
});

const Logo = styled(Typography)({
  color: '#000',
  fontWeight: 'bold',
  fontSize: '24px',
  textDecoration: 'none',
});

const NavButton = styled(Button)({
  padding: '8px 16px',
  marginLeft: '16px',
  '& .MuiSvgIcon-root': {
    marginRight: '8px',
  },
});

const MyPageButton = styled(NavButton)({
  color: '#666',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
});

const AuthButton = styled(NavButton)({
  backgroundColor: '#2196F3',
  color: '#fff',
  '&:hover': {
    backgroundColor: '#1976D2',
  },
});

const Navbar = () => {
  const navigate = useNavigate();
  // AuthContext에서 isLoggedIn과 logout 함수를 가져옵니다.
  const { isLoggedIn, logout } = useAuth(); // <--- 수정: setIsLoggedIn 대신 logout 사용

  const handleLogout = () => {
    // AuthContext의 logout 함수를 호출합니다.
    // 이 함수는 내부적으로 localStorage 정리, isLoggedIn 상태 변경 등을 처리합니다.
    logout(); // <--- 수정: localStorage.clear(), setIsLoggedIn(false) 대신 logout() 호출
    navigate('/'); // 로그아웃 후 홈으로 이동 (또는 로그인 페이지로 이동 '/login')
  };

  return (
      <StyledAppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none' }}>
              <Logo>Having</Logo> {/* 로고 이름은 프로젝트에 맞게 */}
            </RouterLink>
          </Box>
          {isLoggedIn ? (
              <>
                <RouterLink to="/mypage" style={{ textDecoration: 'none' }}>
                  <MyPageButton startIcon={<PersonOutlineIcon />}>
                    마이페이지
                  </MyPageButton>
                </RouterLink>
                <AuthButton
                    onClick={handleLogout}
                    startIcon={<ExitToAppIcon />}
                >
                  로그아웃
                </AuthButton>
              </>
          ) : (
              <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                {/* 로그인 버튼 아이콘이 로그아웃과 동일한 ExitToAppIcon 이고, rotate(180deg)로 되어 있네요.
                필요하다면 다른 아이콘 (예: LoginIcon)을 사용하거나 그대로 두셔도 됩니다. */}
                <AuthButton startIcon={<ExitToAppIcon sx={{ transform: 'rotate(180deg)' }} />}>
                  로그인
                </AuthButton>
              </RouterLink>
          )}
        </Toolbar>
      </StyledAppBar>
  );
};

export default Navbar;