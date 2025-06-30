import React, { useState, useEffect, useCallback } from 'react';
import {
    List, ListItem, ListItemAvatar, Avatar, ListItemText,
    Box, Button, Typography, CircularProgress, Stack
} from '@mui/material';
import api from '../../services/api';

// FriendRequestDto 타입 정의 필요
interface FriendRequest {
    friendshipId: number;
    userId: number;
    name: string;
    profileImageUrl: string;
}

const ReceivedRequestList: React.FC = () => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null); // 처리 중인 요청 ID

    const fetchReceivedRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<FriendRequest[]>('/api/friends/requests/received');
            setRequests(response.data);
        } catch (error) {
            console.error("받은 친구 신청 목록 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReceivedRequests(); }, [fetchReceivedRequests]);

    const handleAccept = async (friendshipId: number) => {
        setProcessingId(friendshipId);
        try {
            await api.post(`/api/friends/accept/${friendshipId}`);
            fetchReceivedRequests(); // 성공 후 목록 새로고침
        } catch (error) {
            alert('친구 신청 수락에 실패했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (friendshipId: number) => {
        setProcessingId(friendshipId);
        try {
            await api.delete(`/api/friends/request/${friendshipId}`);
            fetchReceivedRequests(); // 성공 후 목록 새로고침
        } catch (error) {
            alert('친구 신청 거절에 실패했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <CircularProgress />;
    if (requests.length === 0) return <Typography>받은 친구 신청이 없습니다.</Typography>;

    return (
        <List>
            {requests.map(req => (
                <ListItem
                    key={req.userId}
                    secondaryAction={
                        <Stack direction="row" spacing={1}>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAccept(req.friendshipId)}
                                disabled={processingId === req.friendshipId}
                            >
                                {processingId === req.friendshipId ? <CircularProgress size={20} /> : '수락'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="inherit"
                                size="small"
                                onClick={() => handleReject(req.friendshipId)}
                                disabled={processingId === req.friendshipId}
                            >
                                거절
                            </Button>
                        </Stack>
                    }
                >
                    <ListItemAvatar><Avatar src={req.profileImageUrl} /></ListItemAvatar>
                    <ListItemText primary={req.name} secondary="친구 신청을 보냈습니다." />
                </ListItem>
            ))}
        </List>
    );
};

export default ReceivedRequestList;