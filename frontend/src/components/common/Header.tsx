import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationList from '../notification/NotificationList';

const Header: React.FC = () => {
  const { isLoggedIn, logout } = useAuth();
  
  const handleLogin = () => {
    window.location.href = '/oauth2/authorization/google';
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            스터디 그룹
          </Link>
        </Typography>
        {isLoggedIn ? (
          <>
            <NotificationList />
            <Button color="inherit" onClick={handleLogout}>
              로그아웃
            </Button>
          </>
        ) : (
          <Button color="inherit" onClick={handleLogin}>
            로그인
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header; 