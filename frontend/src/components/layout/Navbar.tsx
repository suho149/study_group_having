import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../../contexts/AuthContext';

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
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <StyledAppBar position="static">
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none' }}>
            <Logo>Having</Logo>
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