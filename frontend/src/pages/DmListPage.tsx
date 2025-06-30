import React, { useState, useEffect, useCallback } from 'react';
import {
    Container, Typography, List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
    Avatar, Box, CircularProgress, Fab, Divider, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DmRoomInfo } from '../types/dm';
import NewDmModal from '../components/dm/NewDmModal';

const DmListPage: React.FC = () => {
    const [rooms, setRooms] = useState<DmRoomInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const fetchDmRooms = useCallback(async () => {
        if (!isLoggedIn) return;
        setLoading(true);
        try {
            const response = await api.get<DmRoomInfo[]>('/api/dm/rooms');
            setRooms(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'DM 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    useEffect(() => {
        fetchDmRooms();
    }, [fetchDmRooms]);

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                다이렉트 메시지
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <List>
                {rooms.length > 0 ? (
                    rooms.map(room => (
                        <React.Fragment key={room.roomId}>
                            <ListItem disablePadding>
                                <ListItemButton onClick={() => navigate(`/dm/room/${room.roomId}`, { state: { partner: room.partner } })}>
                                    <ListItemAvatar>
                                        <Avatar src={room.partner.profileImageUrl} />
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={room.partner.name}
                                        secondary={
                                            <Typography noWrap variant="body2" color="text.secondary">
                                                {room.lastMessage || '아직 대화 내용이 없습니다.'}
                                            </Typography>
                                        }
                                    />
                                    {room.lastMessageTime && (
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Typography>
                                    )}
                                </ListItemButton>
                            </ListItem>
                            <Divider variant="inset" component="li" />
                        </React.Fragment>
                    ))
                ) : (
                    <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                        아직 대화가 없습니다. 새 대화를 시작해보세요.
                    </Typography>
                )}
            </List>

            <Fab
                color="primary"
                aria-label="add"
                sx={{ position: 'fixed', bottom: 32, right: 32 }}
                onClick={() => setIsModalOpen(true)}
            >
                <AddIcon />
            </Fab>

            <NewDmModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </Container>
    );
};

export default DmListPage;