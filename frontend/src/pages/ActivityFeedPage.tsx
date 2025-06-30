import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import api from '../services/api';
import {FeedResponseDto} from "../types/feed";

// FeedResponseDto 타입 정의 필요

const ActivityFeedPage: React.FC = () => {
    const [feeds, setFeeds] = useState<FeedResponseDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/api/feeds')
            .then(response => setFeeds(response.data.content))
            .catch(error => console.error(error))
            .finally(() => setLoading(false));
    }, []);

    const generateFeedMessage = (feed: FeedResponseDto) => {
        // 피드 타입에 따라 다른 메시지 생성
        switch(feed.activityType) {
            case 'CREATE_STUDY':
                return <><b>{feed.actorName}</b>님이 새로운 스터디 <b>'{feed.referenceContent}'</b>를 시작했습니다.</>;
            case 'CREATE_POST':
                return <><b>{feed.actorName}</b>님이 게시판에 <b>'{feed.referenceContent}'</b> 글을 작성했습니다.</>;
            default:
                return '새로운 활동';
        }
    };

    const getFeedLink = (feed: FeedResponseDto) => {
        switch(feed.activityType) {
            case 'CREATE_STUDY': return `/studies/${feed.referenceId}`;
            case 'CREATE_POST': return `/board/post/${feed.referenceId}`;
            default: return '#';
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>활동 피드</Typography>
            <List>
                {feeds.map(feed => (
                    <ListItem key={feed.id} button component={RouterLink} to={getFeedLink(feed)}>
                        <ListItemAvatar><Avatar src={feed.actorProfileUrl} /></ListItemAvatar>
                        <ListItemText
                            primary={generateFeedMessage(feed)}
                            secondary={new Date(feed.createdAt).toLocaleString()}
                        />
                    </ListItem>
                ))}
            </List>
        </Paper>
    );
};

export default ActivityFeedPage;