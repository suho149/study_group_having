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
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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


const MyProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const { isLoggedIn, currentUserId, isLoading: authLoading } = useAuth();
    const [userInfo, setUserInfo] = useState<UserProfile | null>(null);
    const [activitySummary, setActivitySummary] = useState<UserActivitySummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const profilePromise = api.get<UserProfile>('/api/users/me');
                const activityPromise = api.get<UserActivitySummary>('/api/users/me/activity-summary');

                const [profileResponse, activityResponse] = await Promise.all([profilePromise, activityPromise]);

                setUserInfo(profileResponse.data);
                setActivitySummary(activityResponse.data);
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
        </ProfileContainer>
    );
};

export default MyProfilePage;