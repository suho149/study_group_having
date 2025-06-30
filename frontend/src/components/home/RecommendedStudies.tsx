import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, Alert } from '@mui/material';
import api from '../../services/api';
import { StudyGroupResponse } from '../../types/study';
import PostCard from '../post/PostCard'; // 기존 스터디 카드 컴포넌트 재사용

const RecommendedStudies: React.FC = () => {
    const [studies, setStudies] = useState<StudyGroupResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const response = await api.get<StudyGroupResponse[]>('/api/recommendations/studies');
                setStudies(response.data);
            } catch (err: any) {
                setError('추천 스터디를 불러오는 데 실패했습니다.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, []);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert>;
    }

    // 추천 스터디가 없는 경우 섹션을 렌더링하지 않음
    if (studies.length === 0) {
        return null;
    }

    return (
        <Box sx={{ my: 5 }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
                🎯 회원님을 위한 맞춤 스터디
            </Typography>
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
        </Box>
    );
};

export default RecommendedStudies;