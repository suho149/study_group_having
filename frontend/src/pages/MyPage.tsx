// src/pages/MyPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress, // 로딩 스피너 추가
  Button, // 프로필 수정 버튼 등 추가 가능
} from '@mui/material';
import { styled } from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit'; // 프로필 수정 아이콘
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api'; // api 인스턴스 사용
import { useAuth } from '../contexts/AuthContext'; // 인증 상태 및 사용자 ID 확인

// --- Styled Components (기존과 동일 또는 필요에 따라 수정) ---
const ProfileContainer = styled(Paper)(({ theme }) => ({ // theme 인자 추가
  padding: theme.spacing(4), // theme.spacing 사용
  borderRadius: theme.shape.borderRadius * 2, // theme.shape.borderRadius 사용
  marginTop: theme.spacing(4),
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(10), // 80px -> theme.spacing(10)
  height: theme.spacing(10),
  marginRight: theme.spacing(3),
  border: `3px solid ${theme.palette.primary.main}`, // 프로필 이미지 테두리 추가 (예시)
}));

const ProfileInfo = styled(Box)({
  flex: 1,
});

const InfoSection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(3),
  '& + &': { // 연속된 InfoSection 사이의 마진
    marginTop: theme.spacing(3),
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.125rem', // 18px
  fontWeight: 'bold',
  marginBottom: theme.spacing(2),
  color: theme.palette.text.primary,
}));

// --- 데이터 타입 정의 ---
interface UserProfile {
  id: number;
  name: string;
  email: string;
  profileImageUrl?: string; // 프로필 이미지가 없을 수도 있음
  createdAt: string; // ISO 8601 형식의 날짜 문자열
}

interface UserActivitySummary {
  createdPostsCount: number;
  participatingStudiesCount: number;
  participatingProjectsCount: number;
}

const MyPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
  const [activitySummary, setActivitySummary] = useState<UserActivitySummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
      navigate('/login', { replace: true, state: { from: '/mypage' } });
      return;
    }

    if (isLoggedIn && currentUserId) {
      const fetchUserProfile = async () => {
        try {
          setLoadingProfile(true);
          const response = await api.get<UserProfile>('/api/users/me');
          setUserInfo(response.data);
        } catch (err) {
          console.error('사용자 프로필 조회 실패:', err);
          setError('프로필 정보를 불러오는데 실패했습니다.');
        } finally {
          setLoadingProfile(false);
        }
      };

      const fetchUserActivity = async () => {
        try {
          setLoadingActivity(true);
          // 이 API는 예시이며, 실제 구현에 따라 엔드포인트와 응답이 다를 수 있습니다.
          // const response = await api.get<UserActivitySummary>('/api/users/me/activity-summary');
          // setActivitySummary(response.data);
          // 임시 하드코딩 (API 구현 전까지)
          setActivitySummary({
            createdPostsCount: 0, // 실제로는 API에서 받아와야 함
            participatingStudiesCount: 0, // 실제로는 API에서 받아와야 함
            participatingProjectsCount: 0, // 실제로는 API에서 받아와야 함
          });
        } catch (err) {
          console.error('사용자 활동 내역 조회 실패:', err);
          // setError('활동 내역을 불러오는데 실패했습니다.'); // 프로필 에러와 겹칠 수 있으므로 선택적
        } finally {
          setLoadingActivity(false);
        }
      };

      fetchUserProfile();
      fetchUserActivity(); // 활동 내역 API가 있다면 호출
    }
  }, [isLoggedIn, currentUserId, navigate, authLoading]);

  if (authLoading || (isLoggedIn && (loadingProfile || loadingActivity))) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>정보를 불러오는 중...</Typography>
        </Container>
    );
  }

  if (!isLoggedIn) {
    // 이 부분은 useEffect에서 리다이렉트 하므로 거의 도달하지 않음
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography>로그인이 필요한 페이지입니다.</Typography>
          <Button variant="contained" onClick={() => navigate('/login')}>로그인 하러 가기</Button>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Container>
    );
  }

  if (!userInfo) {
    // 로그인 했지만 userInfo가 없는 경우 (이론적으로는 발생하기 어려움, fetch 실패 시 error 상태로 감)
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4, textAlign: 'center' }}>
          <Typography>사용자 정보를 찾을 수 없습니다.</Typography>
        </Container>
    );
  }

  return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={3}>
            <Paper elevation={1} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <List component="nav" sx={{ p: 0 }}>
                <ListItem
                    button
                    // eslint-disable-next-line no-restricted-globals
                    selected={location.pathname === '/mypage' || location.pathname.startsWith('/mypage/profile')}
                    onClick={() => navigate('/mypage')}
                >
                  <ListItemIcon sx={{ minWidth: 40, pl: 1 }}>
                    {/* eslint-disable-next-line no-restricted-globals */}
                    <PersonIcon color={ (location.pathname === '/mypage' || location.pathname.startsWith('/mypage/profile')) ? "primary" : "inherit" } />
                  </ListItemIcon>
                  {/* eslint-disable-next-line no-restricted-globals */}
                  <ListItemText primary="내 프로필" primaryTypographyProps={{ fontWeight: (location.pathname === '/mypage' || location.pathname.startsWith('/mypage/profile')) ? "fontWeightBold" : "fontWeightRegular" }} />
                </ListItem>
                <Divider />
                <ListItem
                    button
                    // eslint-disable-next-line no-restricted-globals
                    selected={location.pathname.startsWith('/notifications')}
                    onClick={() => navigate('/notifications')}
                >
                  <ListItemIcon sx={{ minWidth: 40, pl: 1 }}>
                    {/* eslint-disable-next-line no-restricted-globals */}
                    <NotificationsIcon color={location.pathname.startsWith('/notifications') ? "primary" : "inherit"}/>
                  </ListItemIcon>
                  {/* eslint-disable-next-line no-restricted-globals */}
                  <ListItemText primary="알림 목록" primaryTypographyProps={{ fontWeight: location.pathname.startsWith('/notifications') ? "fontWeightBold" : "fontWeightRegular" }}/>
                </ListItem>
                {/* 추가 메뉴 (예: 내가 참여한 스터디, 내가 만든 스터디 등) */}
              </List>
            </Paper>
          </Grid>
          <Grid item xs={12} md={9}>
            <ProfileContainer elevation={2}> {/* elevation 추가 */}
              <ProfileHeader>
                <ProfileAvatar
                    src={userInfo.profileImageUrl || "/images/default-avatar.png"} // API에서 받은 이미지 또는 기본 이미지
                    alt={userInfo.name}
                />
                <ProfileInfo>
                  <Typography variant="h5" component="h1" fontWeight="bold" gutterBottom>
                    {userInfo.name}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {userInfo.email}
                  </Typography>
                </ProfileInfo>
                <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => navigate('/mypage/edit-profile')} // 프로필 수정 페이지로 이동
                    sx={{ ml: 'auto' }} // 오른쪽 정렬
                >
                  프로필 수정
                </Button>
              </ProfileHeader>

              <Divider sx={{ mb: 3 }} /> {/* 마진 추가 */}

              <InfoSection>
                <SectionTitle>계정 정보</SectionTitle>
                <Grid container spacing={1}> {/* Grid로 레이아웃 구성 */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" gutterBottom>
                      <strong>이메일:</strong> {userInfo.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body1" gutterBottom>
                      <strong>가입일:</strong> {new Date(userInfo.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                </Grid>
              </InfoSection>

              <InfoSection>
                <SectionTitle>나의 활동</SectionTitle>
                {loadingActivity && !activitySummary ? (
                    <CircularProgress size={24} />
                ) : activitySummary ? (
                    <Grid container spacing={1}>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body1" gutterBottom>
                          <strong>작성한 게시글:</strong> {activitySummary.createdPostsCount}개
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body1" gutterBottom>
                          <strong>참여중인 스터디:</strong> {activitySummary.participatingStudiesCount}개
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Typography variant="body1" gutterBottom>
                          <strong>참여중인 프로젝트:</strong> {activitySummary.participatingProjectsCount}개
                        </Typography>
                      </Grid>
                    </Grid>
                ) : (
                    <Typography>활동 내역을 불러오지 못했습니다.</Typography>
                )}
              </InfoSection>
            </ProfileContainer>
          </Grid>
        </Grid>
      </Container>
  );
};

export default MyPage;