import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, Avatar, Typography, CircularProgress, Alert, Chip
} from '@mui/material';
import api from '../../services/api';
import { UserProfile } from '../../types/user'; // UserProfile 타입 정의 필요

interface UserProfileModalProps {
    open: boolean;
    onClose: () => void;
    userId: number | null;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onClose, userId }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && userId) {
            setLoading(true);
            api.get(`/api/users/${userId}/profile`) // 이 API는 새로 만들어야 합니다.
                .then(response => setProfile(response.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        } else {
            setProfile(null); // 모달이 닫히면 프로필 정보 초기화
        }
    }, [open, userId]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>사용자 프로필</DialogTitle>
            <DialogContent>
                {loading ? <CircularProgress /> : profile ? (
                    <Box sx={{textAlign: 'center', p:2}}>
                        <Avatar src={profile.profileImageUrl} sx={{width: 80, height: 80, margin: 'auto'}}/>
                        <Typography variant="h6" sx={{mt:2}}>{profile.name} <Chip label={`Lv. ${profile.level}`} size="small" color="primary" /></Typography>
                        <Typography color="text.secondary">{profile.email}</Typography>
                        <Typography color="text.secondary" variant="body2">포인트: {profile.point}P</Typography>
                        <Typography color="text.secondary" variant="caption">가입일: {new Date(profile.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                ) : <Alert severity="error">프로필을 불러올 수 없습니다.</Alert>}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>닫기</Button>
            </DialogActions>
        </Dialog>
    );
};
export default UserProfileModal;