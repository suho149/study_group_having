import React from 'react';
import {AppBar, Toolbar, Typography, Button, Box, IconButton, Menu, MenuItem, alpha, Tooltip} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { useAuth } from '../../contexts/AuthContext'; // 경로가 올바른지 확인해주세요.
import NotificationList from '../../components/notification/NotificationList';
import MessageIcon from '@mui/icons-material/Message'; // 아이콘 import

// Styled components는 그대로 사용합니다.
const StyledAppBar = styled(AppBar)({
  backgroundColor: '#fff',
  color: '#333', // 글자색 명확히 지정 (배경이 흰색이므로)
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
});

const Logo = styled(Typography)({
  color: '#000',
  fontWeight: 'bold',
  fontSize: '24px',
  textDecoration: 'none',
});

const NavButton = styled(Button)(({ theme }) => ({ // theme 인자 사용 가능
  padding: theme.spacing(1, 2), // theme.spacing 사용
  marginLeft: theme.spacing(2),
  textTransform: 'none', // 버튼 텍스트 대문자화 방지
  fontWeight: 500,
  '& .MuiSvgIcon-root': {
    marginRight: theme.spacing(1),
  },
}));

const MyPageButton = styled(NavButton)(({ theme }) => ({
  color: theme.palette.text.secondary, // 테마의 보조 텍스트 색상 사용
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const AuthButton = styled(NavButton)(({ theme }) => ({
  // backgroundColor: theme.palette.primary.main, // 테마의 primary 색상 사용
  // color: theme.palette.primary.contrastText,
  // '&:hover': {
  //   backgroundColor: theme.palette.primary.dark,
  // },
  // 또는 Outlined 스타일로 변경
  borderColor: theme.palette.primary.main,
  color: theme.palette.primary.main,
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08), // 약간의 호버 효과
    borderColor: theme.palette.primary.dark,
  },
}));

const Navbar = () => {
  const navigate = useNavigate();
  const { isLoggedIn, logout } = useAuth();

  // 사용자 프로필 메뉴 관련 상태
  const [userMenuAnchorEl, setUserMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };
  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose(); // 메뉴 닫기
    navigate('/');
  };

  const handleMyPage = () => {
    navigate('/mypage');
    handleUserMenuClose(); // 메뉴 닫기
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
                {/* --- DM 목록 바로가기 아이콘 추가 --- */}
                <Tooltip title="DM 목록">
                  <IconButton color="inherit" onClick={() => navigate('/dm')}>
                    <MessageIcon />
                  </IconButton>
                </Tooltip>
                {/* NotificationList 컴포넌트 추가 */}
                <NotificationList />

                {/* 사용자 프로필 아이콘 및 메뉴 */}
                <IconButton
                    onClick={handleUserMenuOpen}
                    color="inherit" // 아이콘 색상을 AppBar의 글자색과 맞춤
                    sx={{ ml: 1 }} // 알림 아이콘과의 간격
                    aria-label="account of current user"
                    aria-controls="user-menu-appbar"
                    aria-haspopup="true"
                >
                  <PersonOutlineIcon />
                </IconButton>
                <Menu
                    id="user-menu-appbar"
                    anchorEl={userMenuAnchorEl}
                    open={Boolean(userMenuAnchorEl)}
                    onClose={handleUserMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ mt: '5px' }} // 메뉴 위치 약간 조정
                >
                  <MenuItem onClick={handleMyPage}>마이페이지</MenuItem>
                  <MenuItem onClick={handleLogout} sx={{color: 'error.main'}}>로그아웃</MenuItem>
                </Menu>
              </>
          ) : (
              <>
                <RouterLink to="/login" style={{ textDecoration: 'none' }}>
                  <AuthButton variant="outlined" startIcon={<ExitToAppIcon sx={{ transform: 'rotate(180deg)' }} />}>
                    로그인
                  </AuthButton>
                </RouterLink>
                {/* 필요시 회원가입 버튼 추가 */}
                {/*
              <RouterLink to="/signup" style={{ textDecoration: 'none' }}>
                <Button color="primary" variant="contained" sx={{ ml: 1, textTransform: 'none' }}>
                  회원가입
                </Button>
              </RouterLink>
              */}
              </>
          )}
        </Toolbar>
      </StyledAppBar>
  );
};

export default Navbar;