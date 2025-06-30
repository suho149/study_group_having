// src/pages/LikedPostsPage.tsx (새 파일)
import React, { useState, useEffect, useCallback } from 'react';
import {Container, Typography, Grid, Box, CircularProgress, Button, Alert, Divider} from '@mui/material';
import api from '../services/api';
import { BoardPostSummary } from '../types/board';
import BoardPostItemCard from '../components/board/BoardPostItemCard'; // 재사용
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LikedPostsPage: React.FC = () => {
    const [posts, setPosts] = useState<BoardPostSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();

    const fetchLikedPosts = useCallback(async (page: number, isNewFetch: boolean) => {
        if (!isLoggedIn) return;

        if (isNewFetch) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }
        setError(null);

        try {
            const response = await api.get<{ content: BoardPostSummary[], last: boolean }>(
                '/api/users/me/liked-posts',
                { params: { page, size: 9 } } // 페이지당 9개
            );

            if (response.data && response.data.content) {
                setPosts(prev => isNewFetch ? response.data.content : [...prev, ...response.data.content]);
                setHasMore(!response.data.last);
                setCurrentPage(page);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || '좋아요 한 글을 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn) {
            navigate('/login', { replace: true, state: { from: '/mypage/likes' } });
            return;
        }
        fetchLikedPosts(0, true);
    }, [authLoading, isLoggedIn, navigate, fetchLikedPosts]);

    const handleLoadMore = () => {
        if (hasMore && !isLoadingMore) {
            fetchLikedPosts(currentPage + 1, false);
        }
    };

    if (isLoading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Box>
            <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                좋아요 한 글
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {posts.length > 0 ? (
                <>
                    <Grid container spacing={3}>
                        {posts.map(post => (
                            <Grid item xs={12} sm={6} md={4} key={post.id}>
                                <BoardPostItemCard {...post} />
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
                    좋아요를 누른 게시글이 없습니다.
                </Typography>
            )}
        </Box>
    );
};

export default LikedPostsPage;