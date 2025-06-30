import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Chip, Box, Tooltip, IconButton } from '@mui/material';
import api from '../../services/api';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import CancelScheduleSendIcon from '@mui/icons-material/CancelScheduleSend';

// FriendshipStatusType Enum 정의 필요 (types/friend.ts 등)
export enum FriendshipStatusType {
    NOT_FRIENDS = 'NOT_FRIENDS',
    FRIENDS = 'FRIENDS',
    REQUEST_SENT = 'REQUEST_SENT',
    REQUEST_RECEIVED = 'REQUEST_RECEIVED',
}

interface FriendshipStatusDto {
    status: FriendshipStatusType | null;
    friendshipId: number | null;
}

interface FriendActionButtonProps {
    targetUserId: number;
}

const FriendActionButton: React.FC<FriendActionButtonProps> = ({ targetUserId }) => {
    const [statusInfo, setStatusInfo] = useState<FriendshipStatusDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.get<FriendshipStatusDto>(`/api/friends/status?targetUserId=${targetUserId}`)
            .then(response => setStatusInfo(response.data))
            .catch(error => console.error(error))
            .finally(() => setLoading(false));
    }, [targetUserId]);

    const handleAction = async (action: 'send' | 'accept' | 'cancel' | 'reject') => {
        setLoading(true);
        try {
            switch(action) {
                case 'send':
                    await api.post(`/api/friends/request/${targetUserId}`);
                    break;
                case 'accept':
                    await api.post(`/api/friends/accept/${statusInfo?.friendshipId}`);
                    break;
                case 'cancel':
                case 'reject':
                    await api.delete(`/api/friends/request/${statusInfo?.friendshipId}`);
                    break;
            }
            // 성공 후 상태 다시 조회
            const response = await api.get<FriendshipStatusDto>(`/api/friends/status?targetUserId=${targetUserId}`);
            setStatusInfo(response.data);
        } catch (error) {
            alert('요청 처리에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <CircularProgress size={20} />;

    switch (statusInfo?.status) {
        case FriendshipStatusType.FRIENDS:
            return <Chip label="친구 ✓" color="success" size="small" />;
        case FriendshipStatusType.REQUEST_SENT:
            return <Button variant="outlined" size="small" color="inherit" onClick={() => handleAction('cancel')}>신청 취소</Button>;
        case FriendshipStatusType.REQUEST_RECEIVED:
            return <Button variant="contained" size="small" startIcon={<HowToRegIcon />} onClick={() => handleAction('accept')}>수락</Button>;
        case FriendshipStatusType.NOT_FRIENDS:
            return (
                <Tooltip title="친구 신청">
                    <IconButton onClick={() => handleAction('send')} size="small"><PersonAddIcon /></IconButton>
                </Tooltip>
            );
        default:
            return null; // 자기 자신인 경우 등
    }
};

export default FriendActionButton;