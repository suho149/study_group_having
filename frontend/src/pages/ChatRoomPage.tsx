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
import {ChatMessageResponse, ChatRoomDetailResponse, ChatRoomMemberInfo} from '../types/chat';
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
    const [isCurrentUserJoined, setIsCurrentUserJoined] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);


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
            if (!roomId || !isLoggedIn || !currentUserId) {
                if (!isLoggedIn && roomId) { // 로그아웃 상태로 특정 채팅방 접근 시
                    setLoadingRoomInfo(false);
                    navigate('/login', { state: { from: location.pathname } });
                } else if (isLoggedIn && !currentUserId && !loadingRoomInfo) {
                    // AuthContext에서 currentUserId 로딩 대기 (이미 loadingRoomInfo로 제어)
                } else {
                    setLoadingRoomInfo(false); // 다른 pre-condition 실패 시 로딩 중단
                }
                return;
            }

            console.log('InitializeChatRoom: Starting for roomId:', roomId, 'userId:', currentUserId);
            setLoadingRoomInfo(true);
            setIsCurrentUserJoined(false); // 상태 초기화
            setError(null);               // 에러 상태 초기화

            try {
                const roomInfoResponse = await api.get<ChatRoomDetailResponse>(`/api/chat/rooms/${roomId}`);
                const fetchedRoomInfo = roomInfoResponse.data;
                console.log('InitializeChatRoom: Fetched roomInfo:', fetchedRoomInfo);
                setChatRoomInfo(fetchedRoomInfo);

                const currentUserMembership = fetchedRoomInfo.members.find(
                    (member: ChatRoomMemberInfo) => member.id === currentUserId
                );
                console.log('InitializeChatRoom: currentUserMembership based on fetchedRoomInfo:', currentUserMembership);

                if (currentUserMembership) {
                    if (currentUserMembership.status === 'JOINED') {
                        console.log('InitializeChatRoom: User is JOINED. Setting isCurrentUserJoined to true.');
                        setIsCurrentUserJoined(true); // <--- 여기서 에러가 난다면, setIsCurrentUserJoined 선언 확인
                        await fetchPreviousMessages(Number(roomId), 0, true);
                    } else if (currentUserMembership.status === 'INVITED') {
                        console.log('InitializeChatRoom: User is INVITED. Setting isCurrentUserJoined to false.');
                        setIsCurrentUserJoined(false); // <--- 여기서 에러가 난다면, setIsCurrentUserJoined 선언 확인
                    } else {
                        // LEFT, BLOCKED 등
                        const statusMessage = String(currentUserMembership.status) === 'LEFT' ? "이미 나간 채팅방입니다." : "채팅방에 참여할 수 없는 상태입니다.";
                        console.warn("InitializeChatRoom: User status is not JOINED or INVITED:", currentUserMembership.status, statusMessage);
                        setError(statusMessage); // <--- 여기서 에러가 난다면, setError 선언 확인
                        setIsCurrentUserJoined(false);
                    }
                } else {
                    console.warn("InitializeChatRoom: User is not a member of this chat room (based on fetchedRoomInfo).");
                    setError("이 채팅방의 멤버가 아닙니다."); // <--- 여기서 에러가 난다면, setError 선언 확인
                    setIsCurrentUserJoined(false);
                }

            } catch (err: any) { // err 타입을 any로 명시적 선언 또는 AxiosError로 타입 가드
                console.error("InitializeChatRoom: Error fetching chat room info:", err);
                let errorMessage = "채팅방 정보를 불러오는데 실패했습니다."; // 기본 에러 메시지
                if (err.response && err.response.data && typeof err.response.data.message === 'string') {
                    errorMessage = err.response.data.message;
                } else if (typeof err.message === 'string') {
                    errorMessage = err.message;
                }
                setError(errorMessage); // <--- 여기서 에러가 난다면, setError 선언 확인
                setIsCurrentUserJoined(false); // 에러 시 참여 불가 상태로
            } finally {
                setLoadingRoomInfo(false);
                console.log('InitializeChatRoom: Finished.');
            }
        };

        // isLoggedIn, roomId, currentUserId가 모두 유효할 때만 initializeChatRoom 호출
        if (isLoggedIn && roomId && currentUserId) {
            initializeChatRoom();
        } else if (!isLoggedIn && roomId && !loadingRoomInfo) { // 로딩 중이 아닐 때만 리다이렉트 (무한 루프 방지)
            // setLoadingRoomInfo(false); // 이미 위에서 처리
            // navigate('/login', { state: { from: location.pathname } });
        }
        // AuthContext의 currentUserId가 아직 로드되지 않은 경우(null)에 대한 처리도 고려
        // else if (isLoggedIn && !currentUserId && !authLoading && !loadingRoomInfo) {
        //    setError("사용자 정보를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침 해주세요.");
        // }

// eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, isLoggedIn, currentUserId]); // 의존성 배열은 유지

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
        // isCurrentUserJoined 상태도 확인 (JOINED 상태인 멤버만 메시지 전송 가능하도록)
        if (newMessage.trim() && roomId && currentUserId && isCurrentUserJoined && stompClient && stompClient.active && isConnected) {
            sendMessage(Number(roomId), newMessage.trim()); // messageType 기본값 TALK 사용
            setNewMessage('');
        } else {
            console.warn('Cannot send message. Conditions not met:', {
                message: newMessage.trim(),
                roomId,
                currentUserId,
                isCurrentUserJoined, // <--- 추가된 조건
                stompClientExists: !!stompClient,
                isStompActive: stompClient?.active,
                isStompConnected: isConnected,
            });
            if (!isConnected || !stompClient?.active) {
                alert("채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
            } else if(!isCurrentUserJoined) {
                alert("채팅방에 참여한 후에 메시지를 보낼 수 있습니다.");
            }
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