// src/pages/DmChatPage.tsx (새 파일)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, IconButton, Paper, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, CircularProgress, AppBar, Toolbar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { DmMessageResponse, DmRoomInfo } from '../types/dm';

const DmChatPage: React.FC = () => {
    const { roomId, partnerId } = useParams<{ roomId?: string, partnerId?: string }>();
    const navigate = useNavigate();
    const { currentUserId } = useAuth();
    const { isConnected, subscribeToDm, sendDm } = useChat();

    const [roomInfo, setRoomInfo] = useState<DmRoomInfo | null>(null);
    const [messages, setMessages] = useState<DmMessageResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    // DM 수신 핸들러
    const handleDmReceived = useCallback((message: DmMessageResponse) => {
        // 현재 보고 있는 채팅방의 메시지만 화면에 추가
        if (String(message.roomId) === (roomId || roomInfo?.roomId)) {
            setMessages(prev => [...prev, message]);
        }
    }, [roomId, roomInfo]);

    // DM 채널 구독
    useEffect(() => {
        if (isConnected) {
            subscribeToDm(handleDmReceived);
        }
    }, [isConnected, subscribeToDm, handleDmReceived]);

    // 채팅방 정보 및 이전 메시지 로드
    useEffect(() => {
        const loadChatData = async () => {
            setLoading(true);
            try {
                let currentRoomId = roomId;
                // roomId가 없고 partnerId만 있다면, 채팅방을 찾거나 생성
                if (!currentRoomId && partnerId) {
                    const roomResponse = await api.post<DmRoomInfo>(`/api/dm/rooms/find-or-create?partnerId=${partnerId}`);
                    setRoomInfo(roomResponse.data);
                    currentRoomId = String(roomResponse.data.roomId);
                    // URL을 실제 roomId로 변경하여 새로고침 시 문제 없도록 함
                    navigate(`/dm/room/${currentRoomId}`, { replace: true });
                } else if(currentRoomId) {
                    // TODO: 채팅방 정보를 가져오는 API가 있다면 호출하여 roomInfo 설정
                }

                // 이전 메시지 로드
                if(currentRoomId) {
                    const msgResponse = await api.get<{ content: DmMessageResponse[] }>(`/api/dm/rooms/${currentRoomId}/messages`);
                    setMessages(msgResponse.data.content.reverse());
                }

            } catch (error) {
                console.error("Failed to load DM chat data:", error);
                navigate('/'); // 에러 시 홈으로
            } finally {
                setLoading(false);
            }
        };

        loadChatData();
    }, [roomId, partnerId, navigate]);

    // 스크롤 맨 아래로
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (newMessage.trim() && (roomId || roomInfo?.roomId)) {
            sendDm(Number(roomId || roomInfo?.roomId), newMessage.trim());
            setNewMessage('');
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 0 }}>
            <AppBar position="static" color="inherit" elevation={1}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
                    <Avatar src={roomInfo?.partner.profileImageUrl} sx={{ width: 32, height: 32, mr: 1.5 }} />
                    <Typography variant="h6">{roomInfo?.partner.name}</Typography>
                </Toolbar>
            </AppBar>

            {/* ... 채팅 메시지 렌더링 UI (ChatRoomPage.tsx와 유사) ... */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                <List>
                    {messages.map(msg => {
                        const isMyMessage = msg.sender.id === currentUserId;
                        return (
                            <ListItem key={msg.messageId} sx={{ justifyContent: isMyMessage ? 'flex-end' : 'flex-start' }}>
                                <Paper elevation={1} sx={{ p: '8px 12px', bgcolor: isMyMessage ? 'primary.light' : 'grey.200' }}>
                                    <ListItemText primary={msg.content} secondary={new Date(msg.sentAt).toLocaleTimeString()} />
                                </Paper>
                            </ListItem>
                        );
                    })}
                </List>
                <div ref={messagesEndRef} />
            </Box>

            {/* ... 메시지 입력 UI (ChatRoomPage.tsx와 유사) ... */}
            <Paper elevation={3} sx={{ p: 1.5, display: 'flex', alignItems: 'center' }}>
                <TextField fullWidth size="small" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                <IconButton color="primary" onClick={handleSendMessage}><SendIcon /></IconButton>
            </Paper>
        </Container>
    );
};

export default DmChatPage;