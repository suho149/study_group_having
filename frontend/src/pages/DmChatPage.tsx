import React, { useState, useEffect, useCallback, useRef } from 'react';
import {useParams, useNavigate, useLocation} from 'react-router-dom';
import {
    Container, Box, Typography, TextField, IconButton, Paper, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, CircularProgress, AppBar, Toolbar, Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { DmMessageResponse, DmRoomInfo } from '../types/dm';
import { UserSummaryDto } from '../types/user';
import { IMessage, StompSubscription } from '@stomp/stompjs'; // 타입 추가

const DmChatPage: React.FC = () => {
    const { roomId, partnerId } = useParams<{ roomId?: string, partnerId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUserId, isLoggedIn, isLoading: authLoading } = useAuth();
    const { isConnected, sendDm, stompClient } = useChat();

    // --- 상태 관리 ---
    const [roomInfo, setRoomInfo] = useState<DmRoomInfo | null>(null);
    const [messages, setMessages] = useState<DmMessageResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Ref 관리 ---
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const subscriptionRef = useRef<StompSubscription | null>(null);

    const listRef = useRef<null | HTMLUListElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior }), 50);
    };

    // --- 채팅방 정보 및 이전 메시지 로드 ---
    useEffect(() => {
        const loadChatData = async () => {
            setLoading(true);
            setError(null);
            try {
                let currentRoomId = roomId;
                let fetchedRoomInfo: DmRoomInfo;

                if (!currentRoomId && partnerId) {
                    // 1. 파트너 ID로 채팅방 찾기/생성
                    const response = await api.post<DmRoomInfo>(`/api/dm/rooms/find-or-create?partnerId=${partnerId}`);
                    // state에 파트너 정보를 담아 새 URL로 이동
                    navigate(`/dm/room/${response.data.roomId}`, { replace: true, state: { partner: response.data.partner } });
                    return; // navigate 후 이 useEffect는 다시 실행되므로 여기서 종료
                }

                if (currentRoomId) {
                    // 2. Room ID가 있을 때
                    let fetchedRoomInfo = roomInfo;

                    // 만약 페이지 새로고침 등으로 roomInfo 상태가 비어있다면 API로 다시 가져옴
                    if (!fetchedRoomInfo || !fetchedRoomInfo.partner) {
                        console.log("Partner info not found in state, fetching from API...");
                        const response = await api.get<DmRoomInfo>(`/api/dm/rooms/${currentRoomId}`);
                        fetchedRoomInfo = response.data;
                    }
                    setRoomInfo(fetchedRoomInfo);

                    // 이전 메시지 로드
                    const msgResponse = await api.get<{ content: DmMessageResponse[] }>(`/api/dm/rooms/${currentRoomId}/messages`);
                    setMessages(msgResponse.data.content.reverse());
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "채팅 데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        if (isLoggedIn) {
            loadChatData();
        }
    }, [roomId, partnerId, isLoggedIn, navigate, location.state]); // 의존성 배열 정리


    // --- WebSocket 구독 로직 ---
    useEffect(() => {
        // STOMP가 연결되고, roomId가 있으며, 아직 구독하지 않았을 때 구독
        if (isConnected && stompClient && roomId && !subscriptionRef.current) {
            const destination = `/sub/dm/room/${roomId}`;
            console.log(`Subscribing to DM Room: ${destination}`);

            const sub = stompClient.subscribe(destination, (message: IMessage) => {
                const newMsg: DmMessageResponse = JSON.parse(message.body);
                // 중복 방지 로직을 포함하여 메시지 추가
                setMessages(prev =>
                    prev.some(m => m.messageId === newMsg.messageId) ? prev : [...prev, newMsg]
                );
            });
            subscriptionRef.current = sub;
        }

        // 컴포넌트가 언마운트되거나, roomId가 바뀔 때 기존 구독 해제
        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
                console.log(`Unsubscribed from DM Room: ${roomId}`);
            }
        };
    }, [isConnected, stompClient, roomId]); // roomId가 변경되면 구독을 다시 설정


    // --- 스크롤 맨 아래로 이동 ---
    useEffect(() => {
        scrollToBottom();
    }, [messages]);


    // --- 메시지 전송 핸들러 ---
    const handleSendMessage = () => {
        const content = newMessage.trim();
        const currentRoomId = Number(roomId); // 이제 URL에서 가져온 roomId만 사용

        if (content && currentRoomId && currentUserId) {
            sendDm(currentRoomId, content);
            setNewMessage('');
            // 이제 낙관적 업데이트는 제거합니다. 서버로부터 메시지를 다시 받는 것이 더 확실합니다.
        }
    };

    if (authLoading || loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
    }

    // ★★★ 2. 렌더링 전, roomInfo와 partner 정보가 모두 있는지 확인 (안전장치) ★★★
    if (!roomInfo || !roomInfo.partner) {
        // 이 경우는 보통 데이터 로딩 중이거나 에러가 발생한 경우이므로, 위에서 처리됩니다.
        // 하지만 만약의 경우를 대비한 방어 코드입니다.
        return <Container sx={{ mt: 4 }}><Alert severity="warning">채팅방 정보를 불러오는 중입니다...</Alert></Container>;
    }

    return (
        <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 0, bgcolor: 'background.default' }}>
            <AppBar position="static" color="inherit" elevation={1} sx={{flexShrink:0, borderBottom: '1px solid #ddd'}}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
                    <Avatar src={roomInfo?.partner?.profileImageUrl || undefined} sx={{ width: 32, height: 32, mr: 1.5 }} />
                    <Typography variant="h6">{roomInfo?.partner.name}</Typography>
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: {xs: 1, sm: 2}, bgcolor: 'grey.50' }}>
                <List ref={listRef} sx={{pb:1}}>
                    {messages.map((msg, index) => {
                        const isMyMessage = msg.sender.id === currentUserId;
                        const showAvatar = index === 0 || messages[index - 1].sender.id !== msg.sender.id;

                        return (
                            <ListItem key={msg.messageId} sx={{ display: 'flex', flexDirection: isMyMessage ? 'row-reverse' : 'row', mb: 1, px: 0 }}>
                                {!isMyMessage && (
                                    <ListItemAvatar sx={{ minWidth: 'auto', mr: 1, alignSelf: 'flex-start', visibility: showAvatar ? 'visible' : 'hidden' }}>
                                        <Avatar src={msg.sender.profileImageUrl || undefined} sx={{width:32, height:32}} />
                                    </ListItemAvatar>
                                )}
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, flexDirection: isMyMessage ? 'row-reverse' : 'row', maxWidth: '75%' }}>
                                    <Paper
                                        elevation={0}
                                        sx={{ p: '8px 12px', borderRadius: '12px', bgcolor: isMyMessage ? 'primary.main' : 'background.paper', color: isMyMessage ? 'primary.contrastText' : 'text.primary' }}
                                    >
                                        <Typography variant="body2">{msg.content}</Typography>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary" sx={{whiteSpace: 'nowrap'}}>
                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                            </ListItem>
                        );
                    })}
                </List>
                <div ref={messagesEndRef} />
            </Box>

            <Paper component="form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} elevation={3} sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderTop: '1px solid #ccc' }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="메시지 보내기..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                    multiline
                    maxRows={4}
                    sx={{mr:1, '& .MuiOutlinedInput-root': { borderRadius: '20px', bgcolor: 'grey.100' }}}
                />
                <IconButton type="submit" color="primary" disabled={!newMessage.trim()}><SendIcon /></IconButton>
            </Paper>
        </Container>
    );
};

export default DmChatPage;