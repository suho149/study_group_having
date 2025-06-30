import React, { useState, useEffect, useCallback } from 'react';
import {
    List, ListItem, ListItemAvatar, Avatar, ListItemText,
    Button, Typography, CircularProgress
} from '@mui/material';
import api from '../../services/api';

// FriendRequestDto 타입 재사용
interface FriendRequest {
    friendshipId: number;
    userId: number;
    name: string;
    profileImageUrl: string;
}

const SentRequestList: React.FC = () => {
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const fetchSentRequests = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<FriendRequest[]>('/api/friends/requests/sent');
            setRequests(response.data);
        } catch (error) {
            console.error("보낸 친구 신청 목록 조회 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchSentRequests(); }, [fetchSentRequests]);

    const handleCancel = async (friendshipId: number) => {
        setProcessingId(friendshipId);
        try {
            // 신청 취소는 거절과 동일한 API 사용
            await api.delete(`/api/friends/request/${friendshipId}`);
            fetchSentRequests(); // 성공 후 목록 새로고침
        } catch (error) {
            alert('신청 취소에 실패했습니다.');
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <CircularProgress />;
    if (requests.length === 0) return <Typography>보낸 친구 신청이 없습니다.</Typography>;

    return (
        <List>
            {requests.map(req => (
                <ListItem
                    key={req.userId}
                    secondaryAction={
                        <Button
                            variant="outlined"
                            color="warning"
                            size="small"
                            onClick={() => handleCancel(req.friendshipId)}
                            disabled={processingId === req.friendshipId}
                        >
                            {processingId === req.friendshipId ? <CircularProgress size={20} /> : '신청 취소'}
                        </Button>
                    }
                >
                    <ListItemAvatar><Avatar src={req.profileImageUrl} /></ListItemAvatar>
                    <ListItemText primary={req.name} secondary="친구 신청을 보냈습니다." />
                </ListItem>
            ))}
        </List>
    );
};

export default SentRequestList;