// src/pages/LikedStudiesPage.tsx (새 파일)
import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Grid, Box, CircularProgress, Button, Alert, Divider } from '@mui/material';
import api from '../services/api';
import { StudyGroupResponse } from '../types/study';
import PostCard from '../components/post/PostCard'; // 스터디 카드 컴포넌트 재사용
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LikedStudiesPage: React.FC = () => {
    const [studies, setStudies] = useState<StudyGroupResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const fetchLikedStudies = useCallback(async (page: number, isNewFetch: boolean) => {
        if (!isLoggedIn) return;

        if (isNewFetch) setIsLoading(true);
        else setIsLoadingMore(true);

        setError(null);

        try {
            const response = await api.get<{ content: StudyGroupResponse[], last: boolean }>(
                '/api/users/me/liked-studies',
                { params: { page, size: 9 } }
            );

            if (response.data && response.data.content) {
                setStudies(prev => isNewFetch ? response.data.content : [...prev, ...response.data.content]);
                setHasMore(!response.data.last);
                setCurrentPage(page);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || '좋아요 한 스터디를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            navigate('/login', { replace: true, state: { from: '/mypage/liked-studies' } });
            return;
        }
        fetchLikedStudies(0, true);
    }, [authLoading, isLoggedIn, navigate, fetchLikedStudies]);

    const handleLoadMore = () => {
        if (hasMore && !isLoadingMore) {
            fetchLikedStudies(currentPage + 1, false);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                좋아요 한 스터디
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {studies.length > 0 ? (
                <>
                    <Grid container spacing={3}>
                        {studies.map(study => (
                            <Grid item xs={12} sm={6} md={4} key={study.id}>
                                <PostCard
                                    id={study.id}
                                    category={study.studyType === 'PROJECT' ? '프로젝트' : '스터디'}
                                    title={study.title}
                                    date={new Date(study.createdAt).toLocaleDateString('ko-KR')}
                                    currentMembers={study.currentMembers}
                                    maxMembers={study.maxMembers}
                                    tags={study.tags}
                                    status={study.status}
                                    viewCount={study.viewCount}
                                    initialLikeCount={study.likeCount}
                                    initialIsLiked={study.liked}
                                />
                            </Grid>
                        ))}
                    </Grid>
                    {hasMore && (
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Button onClick={handleLoadMore} disabled={isLoadingMore} variant="outlined">
                                {isLoadingMore ? <CircularProgress size={20} /> : '더보기'}
                            </Button>
                        </Box>
                    )}
                </>
            ) : (
                <Typography color="textSecondary" sx={{ textAlign: 'center', mt: 8 }}>
                    좋아요를 누른 스터디가 없습니다.
                </Typography>
            )}
        </Box>
    );
};

export default LikedStudiesPage;