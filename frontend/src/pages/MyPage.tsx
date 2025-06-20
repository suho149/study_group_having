// src/pages/MyPage.tsx
import React from 'react';
import { Container, Grid, Paper, List, ListItem, ListItemIcon, ListItemText, Divider, ListItemButton } from '@mui/material';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarksIcon from '@mui/icons-material/Bookmarks'; // 좋아요 한 스터디 아이콘
import GroupsIcon from '@mui/icons-material/Groups';
import {jwtDecode} from "jwt-decode"; // 참여중인 스터디 아이콘
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 관리자 여부 확인 로직 추가 ---
  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decodedToken: { authorities?: string } = jwtDecode(token);
      isAdmin = decodedToken.authorities?.includes('ROLE_ADMIN') || false;
    } catch (e) {
      console.error("Invalid token in MyPage", e);
    }
  }

  // 현재 경로에 따라 선택된 메뉴를 판단하는 함수
  const isSelected = (path: string) => location.pathname === path;

  return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3}>
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <List component="nav" sx={{ p: 0 }}>
                {/* --- 관리자일 경우에만 이 메뉴를 렌더링합니다 --- */}
                {isAdmin && (
                    <>
                      <ListItemButton selected={isSelected('/admin')} onClick={() => navigate('/admin')}>
                        <ListItemIcon sx={{ minWidth: 40 }}>
                          <AdminPanelSettingsIcon color={isSelected('/admin') ? "primary" : "inherit"} />
                        </ListItemIcon>
                        <ListItemText primary="관리자 대시보드" />
                      </ListItemButton>
                      <Divider />
                    </>
                )}
                {/* ------------------------------------------- */}

                <ListItemButton selected={isSelected('/mypage') && location.pathname === '/mypage'} onClick={() => navigate('/mypage')}>
                  <ListItemIcon sx={{ minWidth: 40 }}><PersonIcon color={isSelected('/mypage') && location.pathname === '/mypage' ? "primary" : "inherit"} /></ListItemIcon>
                  <ListItemText primary="내 프로필" />
                </ListItemButton>
                <Divider />
                <ListItemButton selected={isSelected('/mypage/liked-posts')} onClick={() => navigate('/mypage/liked-posts')}>
                  <ListItemIcon sx={{ minWidth: 40 }}><FavoriteIcon color={isSelected('/mypage/liked-posts') ? "primary" : "inherit"} /></ListItemIcon>
                  <ListItemText primary="좋아요 한 글" />
                </ListItemButton>
                <Divider />
                <ListItemButton selected={isSelected('/mypage/liked-studies')} onClick={() => navigate('/mypage/liked-studies')}>
                  <ListItemIcon sx={{ minWidth: 40 }}><BookmarksIcon color={isSelected('/mypage/liked-studies') ? "primary" : "inherit"} /></ListItemIcon>
                  <ListItemText primary="좋아요 한 스터디" />
                </ListItemButton>
                <Divider />
                <ListItemButton selected={isSelected('/mypage/participating-studies')} onClick={() => navigate('/mypage/participating-studies')}>
                  <ListItemIcon sx={{ minWidth: 40 }}><GroupsIcon color={isSelected('/mypage/participating-studies') ? "primary" : "inherit"} /></ListItemIcon>
                  <ListItemText primary="참여중인 스터디" />
                </ListItemButton>
                <Divider />
                <ListItemButton selected={isSelected('/notifications')} onClick={() => navigate('/notifications')}>
                  <ListItemIcon sx={{ minWidth: 40 }}><NotificationsIcon color={isSelected('/notifications') ? "primary" : "inherit"} /></ListItemIcon>
                  <ListItemText primary="알림 목록" />
                </ListItemButton>
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            <Outlet />
          </Grid>
        </Grid>
      </Container>
  );
};

export default MyPage;