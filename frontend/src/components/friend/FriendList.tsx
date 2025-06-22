import React, { useState, useEffect, useCallback } from 'react';
import { List, ListItem, ListItemAvatar, Avatar, ListItemText, Button, Typography, CircularProgress } from '@mui/material';
import api from '../../services/api';

// FriendDto 타입 정의 필요
interface Friend { friendshipId: number; userId: number; name: string; profileImageUrl: string; }

const FriendList: React.FC = () => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFriends = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Friend[]>('/api/friends/my');
            setFriends(response.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchFriends(); }, [fetchFriends]);

    const handleDeleteFriend = async (friendshipId: number) => {
        if (!window.confirm("정말로 친구를 삭제하시겠습니까?")) return;
        try {
            // 친구 삭제 API는 /api/friends/request/{friendshipId} 와 동일한 것을 사용
            await api.delete(`/api/friends/request/${friendshipId}`);
            fetchFriends(); // 목록 새로고침
        } catch (error) { alert('친구 삭제에 실패했습니다.'); }
    };

    if (loading) return <CircularProgress />;
    if (friends.length === 0) return <Typography>친구가 없습니다.</Typography>;

    return (
        <List>
            {friends.map(friend => (
                <ListItem key={friend.userId} secondaryAction={
                    <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteFriend(friend.friendshipId)}>삭제</Button>
                }>
                    <ListItemAvatar><Avatar src={friend.profileImageUrl} /></ListItemAvatar>
                    <ListItemText primary={friend.name} />
                </ListItem>
            ))}
        </List>
    );
};
export default FriendList;