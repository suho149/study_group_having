import React, { useState, useEffect, useCallback } from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Button,
    Typography,
    CircularProgress,
    Box, IconButton, Tooltip
} from '@mui/material';
import api from '../../services/api';
import MessageIcon from '@mui/icons-material/Message';
import {useNavigate} from "react-router-dom";
import UserProfileModal from '../common/UserProfileModal';

// FriendDto 타입 정의 필요
interface Friend { friendshipId: number; userId: number; name: string; profileImageUrl: string; }

const FriendList: React.FC = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleOpenProfile = (userId: number) => {
        setSelectedUserId(userId);
        setIsProfileModalOpen(true);
    };

    const fetchFriends = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get<Friend[]>('/api/friends/my');
            setFriends(response.data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, []);

    const handleDmClick = (partnerId: number) => {
        navigate(`/dm/new/${partnerId}`);
    };

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
        <>
            <List>
                {friends.map(friend => (
                    <ListItem
                        key={friend.userId}
                        secondaryAction={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Tooltip title="DM 보내기">
                                    <IconButton onClick={() => handleDmClick(friend.userId)} size="small">
                                        <MessageIcon />
                                    </IconButton>
                                </Tooltip>
                                <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteFriend(friend.friendshipId)}>
                                    삭제
                                </Button>
                            </Box>
                        }
                    >
                        {/* --- 2. 아바타와 이름에 onClick 이벤트와 cursor 스타일을 추가합니다. --- */}
                        <ListItemAvatar onClick={() => handleOpenProfile(friend.userId)} sx={{ cursor: 'pointer' }}>
                            <Avatar src={friend.profileImageUrl} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={friend.name}
                            onClick={() => handleOpenProfile(friend.userId)}
                            sx={{ cursor: 'pointer' }}
                        />
                    </ListItem>
                ))}
            </List>

            {/* --- 3. 리스트 바깥에 UserProfileModal 컴포넌트를 렌더링합니다. --- */}
            <UserProfileModal
                open={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userId={selectedUserId}
            />
        </>
    );
};
export default FriendList;