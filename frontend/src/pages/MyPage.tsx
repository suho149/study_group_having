// src/pages/MyPage.tsx
import React from 'react';
import { Container, Grid, Paper, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 현재 경로에 따라 선택된 메뉴를 판단하는 함수
  const isSelected = (path: string) => location.pathname === path;

  return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* 좌측 네비게이션 메뉴 */}
          <Grid item xs={12} md={3}>
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <List component="nav" sx={{ p: 0 }}>
                <ListItem button selected={isSelected('/mypage')} onClick={() => navigate('/mypage')}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PersonIcon color={isSelected('/mypage') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText primary="내 프로필" />
                </ListItem>
                <Divider />
                <ListItem button selected={isSelected('/mypage/likes')} onClick={() => navigate('/mypage/likes')}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <FavoriteIcon color={isSelected('/mypage/likes') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText primary="좋아요 한 글" />
                </ListItem>
                <Divider />
                <ListItem button selected={location.pathname.startsWith('/notifications')} onClick={() => navigate('/notifications')}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <NotificationsIcon color={location.pathname.startsWith('/notifications') ? "primary" : "inherit"} />
                  </ListItemIcon>
                  <ListItemText primary="알림 목록" />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* 우측 컨텐츠 영역 (자식 라우트가 렌더링될 위치) */}
          <Grid item xs={12} md={9}>
            <Outlet />
          </Grid>
        </Grid>
      </Container>
  );
};

export default MyPage;