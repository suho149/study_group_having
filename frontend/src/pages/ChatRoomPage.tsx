import React, {useState, useEffect, useRef, useCallback, useMemo} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, IconButton, Paper, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, CircularProgress, AppBar, Toolbar, Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext'; // ChatContext 사용
import { ChatMessageResponse, ChatRoomDetailResponse } from '../types/chat';
import { MessageType } from '../types/apiSpecificEnums';

const ChatRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const { currentUserId, isLoggedIn } = useAuth();
    const { stompClient, isConnected, subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();

    const [chatRoomInfo, setChatRoomInfo] = useState<ChatRoomDetailResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingRoomInfo, setLoadingRoomInfo] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false); // 이전 메시지 로딩 상태
    const [hasMoreMessages, setHasMoreMessages] = useState(true); // 더 불러올 메시지가 있는지
    const [currentPage, setCurrentPage] = useState(0); // 메시지 페이징
    const messagesEndRef = useRef<null | HTMLDivElement>(null); // 자동 스크롤용
    const listRef = useRef<null | HTMLUListElement>(null); // 이전 메시지 로드 시 스크롤 위치 유지용
    const [subscriptionId, setSubscriptionId] = useState<string | undefined>(undefined);
    const [isInvitePending, setIsInvitePending] = useState(false); // 초대 수락/거절 처리 중 상태


    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // 채팅방 정보 및 초기 메시지 로드
    const fetchChatRoomData = useCallback(async () => {
        if (!roomId || !isLoggedIn) return;
        setLoadingRoomInfo(true);
        try {
            const roomInfoResponse = await api.get<ChatRoomDetailResponse>(`/api/chat/rooms/${roomId}`);
            setChatRoomInfo(roomInfoResponse.data);
            // 초기 메시지 로드 (첫 페이지)
            await fetchPreviousMessages(Number(roomId), 0, true); // isInitialLoad = true
        } catch (error) {
            console.error("Error fetching chat room info:", error);
            // navigate('/not-found'); // 또는 에러 페이지
        } finally {
            setLoadingRoomInfo(false);
        }
    }, [roomId, isLoggedIn]);

    // 이전 메시지 로드 함수
    const fetchPreviousMessages = useCallback(async (currentRoomId: number, page: number, isInitialLoad = false) => {
        if (!hasMoreMessages && !isInitialLoad) return; // 더 이상 메시지가 없으면 로드 안 함 (초기 로드 제외)
        setLoadingMessages(true);
        try {
            const response = await api.get<any>(`/api/chat/rooms/${currentRoomId}/messages`, { // 응답 타입은 Page<ChatMessageResponse>
                params: { page, size: 20, sort: 'createdAt,desc' } // 백엔드와 동일하게 createdAt 또는 sentAt
            });
            const newMessages = response.data.content.reverse(); // 오래된 메시지부터 보이도록 순서 뒤집기

            setMessages(prev => isInitialLoad ? newMessages : [...newMessages, ...prev]);
            setHasMoreMessages(!response.data.last); // 마지막 페이지인지 확인
            setCurrentPage(page);

            if (isInitialLoad) {
                setTimeout(() => scrollToBottom("auto"), 100); // 초기 로드 시 맨 아래로
            } else if (listRef.current && newMessages.length > 0) {
                // 이전 메시지 로드 후 스크롤 위치 유지 (새 메시지 높이만큼 올림)
                const firstNewMessageElement = listRef.current.children[newMessages.length -1]; // 첫 번째 새 메시지 (역순이므로)
                if(firstNewMessageElement) {
                    // 이 부분은 좀 더 정교한 계산이 필요할 수 있음
                    // listRef.current.scrollTop = firstNewMessageElement.offsetTop - listRef.current.offsetTop;
                }
            }

        } catch (error) {
            console.error("Error fetching previous messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    }, [hasMoreMessages]);


    useEffect(() => {
        fetchChatRoomData();
    }, [fetchChatRoomData]); // roomId 변경 시 다시 로드


    // WebSocket 구독 설정
    useEffect(() => {
        if (isConnected && stompClient && roomId && !subscriptionId) {
            const subId = subscribeToRoom(Number(roomId), (message) => {
                console.log('New message received:', message);
                setMessages(prevMessages => [...prevMessages, message]);
                // 새 메시지 수신 시 자동 스크롤 (현재 사용자가 보낸 메시지이거나, 스크롤이 맨 아래 근처일 때)
                // TODO: 스크롤 위치에 따른 자동 스크롤 로직 개선
                setTimeout(() => scrollToBottom(), 100);
            });
            setSubscriptionId(subId);
            console.log(`Subscribed with ID: ${subId} to room ${roomId}`);
        }

        // 컴포넌트 언마운트 시 또는 roomId 변경 시 구독 해제
        return () => {
            if (subscriptionId && roomId) { // roomId도 조건에 추가
                console.log(`Unsubscribing with ID: ${subscriptionId} from room ${roomId}`);
                unsubscribeFromRoom(subscriptionId); // 또는 roomId.toString()
                setSubscriptionId(undefined);
            }
        };
    }, [isConnected, stompClient, roomId, subscribeToRoom, unsubscribeFromRoom, subscriptionId]);

    useEffect(() => {
        const initializeChatRoom = async () => {
            if (!roomId || !isLoggedIn || !currentUserId) return;
            setLoadingRoomInfo(true);
            try {
                const roomInfoResponse = await api.get<ChatRoomDetailResponse>(`/api/chat/rooms/${roomId}`);
                setChatRoomInfo(roomInfoResponse.data);

                // 현재 사용자의 멤버십 상태 확인
                const currentUserMembership = roomInfoResponse.data.members.find(
                    (member) => member.id === currentUserId
                );
                // 백엔드 ChatRoomDetailResponse.from() 에서 members는 JOINED 상태만 반환하므로,
                // ChatRoomMember 테이블을 직접 조회하거나, ChatRoomDetailResponse에 모든 멤버 정보를 포함해야 함.
                // 여기서는 임시로, ChatRoomDetailResponse.members에 모든 상태의 멤버가 있다고 가정.
                // 또는 별도의 API로 현재 유저의 ChatRoomMember 상태를 가져와야 함.
                // 지금은 ChatService.getChatRoomDetail 에서 INVITED/JOINED 멤버만 접근 가능하므로,
                // 이 페이지에 들어왔다는 것은 적어도 INVITED 상태 이상이라는 의미.
                // INVITED 상태라면 수락 UI를 보여줘야 함.

                // ChatRoomDetailResponse가 JOINED 멤버만 반환한다면,
                // 사용자가 INVITED 상태인지 확인하는 별도 로직/API 필요.
                // 임시방편: ChatService.getChatRoomDetail에서 예외 대신 null이나 특정 상태 반환 고려
                // 또는, ChatRoomPage 진입 전에 초대 수락을 완료하도록 유도 (알림 페이지 등에서)

                // fetchPreviousMessages를 호출하기 전에 사용자가 JOINED 상태인지 확인하거나,
                // INVITED 상태라면 수락 프로세스를 먼저 진행하도록 유도.
                // 여기서는 일단 JOINED 상태라고 가정하고 메시지 로드.
                // 실제로는 사용자가 INVITED 상태면, 메시지 로드 전에 수락 UI를 보여줘야 함.

                // 초대 수락 UI를 위한 상태 확인 (chatRoomInfo에 현재 유저의 status가 있다면)
                // if (currentUserMembership && currentUserMembership.status === 'INVITED') {
                //   // 초대 수락 UI 표시 로직
                // } else if (currentUserMembership && currentUserMembership.status === 'JOINED') {
                await fetchPreviousMessages(Number(roomId), 0, true);
                // }

            } catch (error: any) {
                console.error("Error fetching chat room info:", error);
                if (error.response?.status === 403 || error.response?.status === 401) {
                    // 접근 권한 없음 또는 인증 실패
                    // alert("채팅방에 접근할 권한이 없습니다.");
                    // navigate('/studies'); // 또는 다른 적절한 페이지로 이동
                }
            } finally {
                setLoadingRoomInfo(false);
            }
        };

        initializeChatRoom();
// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, isLoggedIn, currentUserId]); // fetchPreviousMessages 제거

    const handleAcceptInvite = async () => {
        if (!roomId) return;
        setIsInvitePending(true);
        try {
            await api.post(`/api/chat/rooms/${roomId}/invites/respond?accept=true`);
            // 성공 시 채팅방 정보 및 메시지 다시 로드 또는 상태 업데이트
            await fetchChatRoomData(); // 전체 데이터 다시 로드 (가장 간단)
            // 또는 setChatRoomInfo를 통해 멤버 상태만 업데이트하고, fetchPreviousMessages 호출
            // Snackbar로 성공 메시지 표시
        } catch (error: any) {
            console.error("Error accepting chat invite:", error);
            alert(error.response?.data?.message || "초대 수락 중 오류가 발생했습니다.");
        } finally {
            setIsInvitePending(false);
        }
    };

    const handleRejectInvite = async () => {
        if (!roomId) return;
        setIsInvitePending(true);
        try {
            await api.post(`/api/chat/rooms/${roomId}/invites/respond?accept=false`);
            // 거절 성공 시 이전 페이지로 이동 또는 메시지 표시
            alert("채팅방 초대를 거절했습니다.");
            navigate(-1); // 이전 페이지로
        } catch (error: any) {
            console.error("Error rejecting chat invite:", error);
            alert(error.response?.data?.message || "초대 거절 중 오류가 발생했습니다.");
        } finally {
            setIsInvitePending(false);
        }
    };

    // 현재 사용자의 ChatRoomMember 정보 찾기 (렌더링 로직에서 사용)
    const currentUserChatMembership = useMemo(() => {
        if (!chatRoomInfo || !currentUserId) return null;
        // ChatRoomDetailResponse에 모든 멤버 정보가 포함되어야 정확한 status 확인 가능
        // 백엔드의 ChatRoomDetailResponse.from() 메소드가 모든 멤버를 반환하도록 수정 필요
        // 또는, chatRoomInfo 대신 별도의 API로 현재 유저의 멤버십 정보를 가져와야 함
        // 임시로 chatRoomInfo.members가 모든 상태의 멤버를 포함한다고 가정
        return chatRoomInfo.members.find(member => member.id === currentUserId);
    }, [chatRoomInfo, currentUserId]);

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (newMessage.trim() && roomId && currentUserId) {
            sendMessage(Number(roomId), newMessage.trim());
            setNewMessage('');
        }
    };

    // 이전 메시지 로드를 위한 스크롤 이벤트 핸들러 (선택적 고급 기능)
    const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop === 0 && !loadingMessages && hasMoreMessages && roomId) {
            console.log("Fetching more messages...");
            fetchPreviousMessages(Number(roomId), currentPage + 1);
        }
    };


    if (loadingRoomInfo || !isLoggedIn) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
    }
    if (!chatRoomInfo) {
        return <Typography sx={{textAlign:'center', mt:5}}>채팅방 정보를 불러올 수 없습니다.</Typography>;
    }

    return (
        <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 0 }}> {/* Navbar 높이 제외 */}
            <AppBar position="static" color="default" elevation={1} sx={{flexShrink:0}}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1, fontWeight:'bold' }}>
                        {chatRoomInfo.name}
                    </Typography>
                    <Chip label={`${chatRoomInfo.members.length}명 참여중`} size="small" />
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.100' }}>
                <List ref={listRef} onScroll={handleScroll}> {/* 스크롤 이벤트 핸들러 추가 */}
                    {loadingMessages && currentPage > 0 && ( // 초기 로드 외의 이전 메시지 로딩
                        <ListItem sx={{justifyContent: 'center'}}><CircularProgress size={20}/></ListItem>
                    )}
                    {messages.map((msg) => (
                        <ListItem key={msg.messageId} sx={{
                            display: 'flex',
                            flexDirection: msg.sender.id === currentUserId ? 'row-reverse' : 'row',
                            mb: 1,
                        }}>
                            <ListItemAvatar sx={{
                                minWidth: 'auto',
                                ml: msg.sender.id === currentUserId ? 1 : 0,
                                mr: msg.sender.id === currentUserId ? 0 : 1,
                            }}>
                                <Avatar src={msg.sender.profileImageUrl || undefined} alt={msg.sender.name} sx={{width:32, height:32}}>
                                    {!msg.sender.profileImageUrl && msg.sender.name[0]}
                                </Avatar>
                            </ListItemAvatar>
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    mb: 0.2,
                                    flexDirection: msg.sender.id === currentUserId ? 'row-reverse' : 'row',
                                }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold'}}>
                                        {msg.sender.id === currentUserId ? '나' : msg.sender.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                </Box>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: '8px 12px',
                                        borderRadius: msg.sender.id === currentUserId ? '12px 12px 0 12px' : '12px 12px 12px 0',
                                        bgcolor: msg.sender.id === currentUserId ? 'primary.main' : 'background.paper',
                                        color: msg.sender.id === currentUserId ? 'primary.contrastText' : 'text.primary',
                                        maxWidth: '70%',
                                        wordBreak: 'break-word',
                                        border: msg.sender.id !== currentUserId ? '1px solid #eee' : 'none'
                                    }}
                                >
                                    {msg.messageType === MessageType.ENTER && <Typography variant="body2" sx={{fontStyle:'italic', opacity:0.8}}>{msg.content}</Typography>}
                                    {msg.messageType === MessageType.LEAVE && <Typography variant="body2" sx={{fontStyle:'italic', opacity:0.8}}>{msg.content}</Typography>}
                                    {msg.messageType === MessageType.TALK && <Typography variant="body2">{msg.content}</Typography>}
                                    {/* 이미지, 파일 타입에 대한 렌더링 추가 가능 */}
                                </Paper>
                            </Box>
                        </ListItem>
                    ))}
                    <div ref={messagesEndRef} /> {/* 자동 스크롤 타겟 */}
                </List>
            </Box>

            <Paper elevation={2} sx={{ p: 1, display: 'flex', alignItems: 'center', borderTop: '1px solid #ddd', flexShrink:0 }}>
                {/* TODO: 파일 업로드, 이모티콘 버튼 등 추가 가능 */}
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="메시지를 입력하세요..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey ? handleSendMessage(e) : null}
                    multiline
                    maxRows={3}
                    sx={{mr:1}}
                />
                <IconButton color="primary" onClick={() => handleSendMessage()} disabled={!newMessage.trim()}>
                    <SendIcon />
                </IconButton>
            </Paper>
        </Container>
    );
};

export default ChatRoomPage;