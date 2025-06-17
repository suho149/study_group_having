// src/pages/MyProfilePage.tsx (새 파일)
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Avatar,
    Divider,
    Grid,
    CircularProgress,
    Button,
    Alert,
    Chip,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Badge } from '../types/badge'; // 뱃지 타입 import
// --- Material-UI 아이콘 import ---
import NewReleasesIcon from '@mui/icons-material/NewReleases'; // '새싹' (NEWBIE) 뱃지 아이콘
import CreateIcon from '@mui/icons-material/Create'; // '첫 걸음' (FIRST_POST) 뱃지 아이콘
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // 기본 뱃지 아이콘

// --- 데이터 타입 정의 ---
interface UserProfile {
    id: number;
    name: string;
    email: string;
    profileImageUrl?: string;
    createdAt: string;
    point: number; // 추가
    level: number; // 추가
}

interface UserActivitySummary {
    createdPostsCount: number;
    participatingStudiesCount: number;
    createdStudiesCount: number;
}

// --- 스타일 컴포넌트 ---
const ProfileContainer = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius * 2,
    marginTop: theme.spacing(0), // MyPage에서 mt가 있으므로 여기선 0으로 조정
}));

const ProfileHeader = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
    width: theme.spacing(10),
    height: theme.spacing(10),
    marginRight: theme.spacing(3),
    border: `3px solid ${theme.palette.primary.main}`,
}));

const ProfileInfo = styled(Box)({
    flex: 1,
});

const InfoSection = styled(Box)(({ theme }) => ({
    marginTop: theme.spacing(3),
    '& + &': {
        marginTop: theme.spacing(3),
    },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
    fontSize: '1.125rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(2),
    color: theme.palette.text.primary,
}));

// --- 1. 뱃지 이름과 아이콘을 매핑하는 객체 생성 ---
const badgeIcons: { [key: string]: React.ReactElement } = {
    NEWBIE: <NewReleasesIcon />,
    FIRST_POST: <CreateIcon />,
    // 여기에 새로운 뱃지가 추가될 때마다 아이콘을 매핑합니다.
    // 예: STUDY_LEADER: <GroupsIcon />,
    DEFAULT: <EmojiEventsIcon />, // 해당하는 아이콘이 없을 때 보여줄 기본 아이콘
};

const MyProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [activitySummary, setActivitySummary] = useState<UserActivitySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loadingBadges, setLoadingBadges] = useState(true);

    useEffect(() => {
        if (authLoading) return; // 인증 상태 로딩 중에는 대기
        if (!isLoggedIn) {
            navigate('/login', { replace: true, state: { from: '/mypage' } });
            return;
        }

        const fetchAllData = async () => {
            setLoading(true);
            setError(null);
            try {
                // --- 1. Promise.all에 뱃지 API 호출을 추가합니다 ---
                const [profileRes, activityRes, badgesRes] = await Promise.all([
                    api.get<UserProfile>('/api/users/me'),
                    api.get<UserActivitySummary>('/api/users/me/activity-summary'),
                    api.get<Badge[]>(`/api/users/${currentUserId}/badges`)
                ]);

                setUserInfo(profileRes.data);
                setActivitySummary(activityRes.data);
                setBadges(badgesRes.data);

            } catch (err: any) {
                console.error('마이페이지 데이터 조회 실패:', err);
                setError(err.response?.data?.message || '정보를 불러오는데 실패했습니다.');
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [isLoggedIn, currentUserId, navigate, authLoading]);

    if (loading || authLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    if (!userInfo) {
        return <Typography>사용자 정보를 찾을 수 없습니다.</Typography>;
    }

    return (
        <ProfileContainer elevation={2}>
            <ProfileHeader>
                <ProfileAvatar src={userInfo.profileImageUrl || "/images/default-avatar.png"} alt={userInfo.name} />
                <ProfileInfo>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="h5" component="h1" fontWeight="bold">
                            {userInfo.name}
                        </Typography>
                        <Chip label={`Lv. ${userInfo.level}`} color="primary" size="small" />
                    </Box>
                    <Typography variant="body1" color="text.secondary">
                        {userInfo.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        포인트: {userInfo.point.toLocaleString()} P
                    </Typography>
                </ProfileInfo>
                <Button variant="outlined" startIcon={<EditIcon />} onClick={() => navigate('/mypage/edit-profile')}>프로필 수정</Button>
            </ProfileHeader>
            <Divider sx={{ mb: 3 }} />

            <InfoSection>
                <SectionTitle>계정 정보</SectionTitle>
                <Grid container spacing={1}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body1" gutterBottom>
                            <strong>이메일:</strong> {userInfo.email}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="body1" gutterBottom>
                            <strong>가입일:</strong> {new Date(userInfo.createdAt).toLocaleDateString('ko-KR')}
                        </Typography>
                    </Grid>
                </Grid>
            </InfoSection>

            <InfoSection>
                <SectionTitle>나의 활동</SectionTitle>
                {activitySummary ? (
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}><Typography><strong>작성한 글:</strong> {activitySummary.createdPostsCount}개</Typography></Grid>
                        <Grid item xs={12} sm={4}><Typography><strong>생성한 스터디:</strong> {activitySummary.createdStudiesCount}개</Typography></Grid>
                        <Grid item xs={12} sm={4}><Typography><strong>참여중인 스터디:</strong> {activitySummary.participatingStudiesCount}개</Typography></Grid>
                    </Grid>
                ) : (
                    <Typography color="text.secondary">활동 내역을 불러올 수 없습니다.</Typography>
                )}
            </InfoSection>

            {/* --- 2. 획득한 뱃지를 렌더링하는 UI를 추가합니다 --- */}
            <InfoSection>
                <SectionTitle>획득한 뱃지</SectionTitle>
                {badges.length > 0 ? (
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        {badges.map(badge => (
                            <Tooltip key={badge.name} title={badge.description} arrow>
                                <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', width: 48, height: 48 }}>
                                    {badgeIcons[badge.name] || badgeIcons['DEFAULT']}
                                </Avatar>
                            </Tooltip>
                        ))}
                    </Box>
                ) : (
                    <Typography color="text.secondary">아직 획득한 뱃지가 없습니다.</Typography>
                )}
            </InfoSection>
        </ProfileContainer>
    );
};

export default MyProfilePage;