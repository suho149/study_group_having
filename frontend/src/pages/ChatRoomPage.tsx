import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // useLocation 추가
import {
    Container, Box, Typography, TextField, IconButton, Paper, List, ListItem,
    ListItemAvatar, Avatar, ListItemText, CircularProgress, AppBar, Toolbar, Chip, Button, Alert, Divider,
    Menu, MenuItem, ListItemIcon as MuiListItemIcon, // Menu, MenuItem, ListItemIcon 추가
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle // Dialog 관련 컴포넌트
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { ChatMessageResponse, ChatRoomDetailResponse, ChatRoomMemberInfo } from '../types/chat';
import { MessageType } from '../types/apiSpecificEnums';

import MoreVertIcon from '@mui/icons-material/MoreVert'; // 메뉴 아이콘
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // 멤버 초대 아이콘
import ExitToAppIcon from '@mui/icons-material/ExitToApp'; // 나가기 아이콘
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'; // 멤버 내보내기 아이콘
import CrownIcon from '@mui/icons-material/EmojiEvents'; // 왕관 아이콘 (방장 표시용)
import InviteToChatRoomModal from '../components/chat/InviteToChatRoomModal'; // 초대 모달 import
import { StudyMemberRole } from '../types/study'; // 스터디 멤버 역할 Enum

const ChatRoomPage: React.FC = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const navigate = useNavigate();
    const location = useLocation(); // 현재 경로 정보 (로그인 후 리다이렉션용)
    const { currentUserId, isLoggedIn, isLoading: authLoading } = useAuth(); // authLoading 추가
    const { stompClient, isConnected, subscribeToRoom, unsubscribeFromRoom, sendMessage } = useChat();

    const [chatRoomInfo, setChatRoomInfo] = useState<ChatRoomDetailResponse | null>(null);
    const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingPageData, setLoadingPageData] = useState(true); // 페이지 전체 데이터 로딩 상태
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const listRef = useRef<null | HTMLUListElement>(null);
    const [subscriptionId, setSubscriptionId] = useState<string | undefined>(undefined);
    const [isInviteProcessing, setIsInviteProcessing] = useState(false); // 초대 응답 API 처리 중 상태
    const [pageError, setPageError] = useState<string | null>(null); // 페이지 레벨 에러 메시지

    // 메뉴 관련 상태
    const [anchorElMenu, setAnchorElMenu] = React.useState<null | HTMLElement>(null);
    const [selectedMemberForAction, setSelectedMemberForAction] = useState<ChatRoomMemberInfo | null>(null); // 내보내기 대상
    const [isLeaveChatConfirmOpen, setIsLeaveChatConfirmOpen] = useState(false);
    const [isRemoveMemberConfirmOpen, setIsRemoveMemberConfirmOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isProcessingChatAction, setIsProcessingChatAction] = useState(false); // 채팅방 나가기, 멤버 내보내기 로딩

    const [isManageMembersDialogOpen, setIsManageMembersDialogOpen] = useState(false);
    const [selectedMemberToRemove, setSelectedMemberToRemove] = useState<ChatRoomMemberInfo | null>(null);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const fetchPreviousMessages = useCallback(async (currentRoomId: number, page: number, isInitialLoad = false) => {
        if (!hasMoreMessages && !isInitialLoad) return;
        setLoadingMessages(true);
        try {
            const response = await api.get<{ content: ChatMessageResponse[], last: boolean }>(
                `/api/chat/rooms/${currentRoomId}/messages`,
                { params: { page, size: 20, sort: 'createdAt,desc' } }
            );
            const newMessages = response.data.content.reverse();
            setMessages(prev => isInitialLoad ? newMessages : [...newMessages, ...prev]);
            setHasMoreMessages(!response.data.last);
            setCurrentPage(page);
            if (isInitialLoad) {
                setTimeout(() => scrollToBottom("auto"), 150); // 약간의 딜레이 추가
            }
        } catch (error) {
            console.error("Error fetching previous messages:", error);
            setPageError("메시지를 불러오는 중 오류가 발생했습니다.");
        } finally {
            setLoadingMessages(false);
        }
    }, [hasMoreMessages]); // currentPage 의존성 제거 (함수 내에서 page 파라미터 사용)

    // 채팅방 정보 초기화 및 멤버십 상태 확인
    const initializeChatRoomData = useCallback(async () => {
        if (!roomId || !isLoggedIn || !currentUserId) {
            if (!isLoggedIn && roomId) {
                navigate('/login', { state: { from: location.pathname }, replace: true });
            }
            setLoadingPageData(false);
            return;
        }

        console.log('InitializeChatRoomData: Starting for roomId:', roomId, 'userId:', currentUserId);
        setLoadingPageData(true);
        setPageError(null);

        try {
            const roomInfoResponse = await api.get<ChatRoomDetailResponse>(`/api/chat/rooms/${roomId}`);
            const fetchedRoomInfo = roomInfoResponse.data;
            setChatRoomInfo(fetchedRoomInfo);

            const currentUserMembership = fetchedRoomInfo.members.find(
                (member: ChatRoomMemberInfo) => member.id === currentUserId
            );

            if (currentUserMembership) {
                if (currentUserMembership.status === 'JOINED') {
                    await fetchPreviousMessages(Number(roomId), 0, true);
                } else if (currentUserMembership.status === 'INVITED') {
                    // INVITED 상태면 초대 수락 UI를 보여주므로, 여기서는 별도 작업 없음
                    console.log("User is INVITED. Waiting for user action.");
                } else {
                    setPageError(`채팅방에 참여할 수 없는 상태입니다 (상태: ${currentUserMembership.status}).`);
                }
            } else {
                setPageError("이 채팅방의 멤버가 아닙니다.");
            }
        } catch (err: any) {
            console.error("InitializeChatRoomData: Error:", err);
            const errorMessage = err.response?.data?.message || err.message || "채팅방 정보를 불러오는데 실패했습니다.";
            setPageError(errorMessage);
        } finally {
            setLoadingPageData(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId, isLoggedIn, currentUserId, navigate, location.pathname, fetchPreviousMessages]); // fetchPreviousMessages 추가


    useEffect(() => {
        // AuthContext 로딩이 끝나고, 필요한 정보가 모두 있을 때 데이터 요청
        if (!authLoading && isLoggedIn && currentUserId && roomId) {
            initializeChatRoomData();
        } else if (!authLoading && !isLoggedIn && roomId) {
            // 로그아웃 상태로 직접 접근 시 로그인 페이지로
            setLoadingPageData(false); // 로딩 중단
            navigate('/login', { state: { from: location.pathname }, replace: true });
        } else if (!authLoading && isLoggedIn && !currentUserId) {
            // 매우 드문 경우: 로그인 되었으나 사용자 ID가 없는 경우
            setLoadingPageData(false);
            setPageError("사용자 정보를 확인할 수 없습니다. 다시 로그인해주세요.");
        }
    }, [authLoading, isLoggedIn, currentUserId, roomId, initializeChatRoomData, navigate, location.pathname]);


    // WebSocket 구독 설정
    useEffect(() => {
        let subIdToUnsubscribe: string | undefined;
        if (isConnected && stompClient && roomId && chatRoomInfo) {
            // 현재 유저가 JOINED 상태일 때만 구독
            const currentUserMembership = chatRoomInfo.members.find(m => m.id === currentUserId);
            if (currentUserMembership?.status === 'JOINED' && !subscriptionId) {
                const newSubId = subscribeToRoom(Number(roomId), (message) => {
                    setMessages(prevMessages => [...prevMessages, message]);
                    setTimeout(() => scrollToBottom(), 100);
                });
                setSubscriptionId(newSubId);
                subIdToUnsubscribe = newSubId; // 클린업에서 사용할 ID
                console.log(`Subscribed with ID: ${newSubId} to room ${roomId}`);
            }
        }
        return () => {
            const idToUse = subIdToUnsubscribe || subscriptionId; // 클린업 시점의 ID 사용
            if (idToUse && roomId) {
                console.log(`Unsubscribing with ID: ${idToUse} from room ${roomId}`);
                unsubscribeFromRoom(idToUse);
                setSubscriptionId(undefined); // 구독 ID 초기화
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isConnected, stompClient, roomId, chatRoomInfo, currentUserId, subscribeToRoom, unsubscribeFromRoom]); // subscriptionId 제거

    // --- 메뉴 핸들러 ---
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorElMenu(event.currentTarget);
    const handleMenuClose = () => {
        setAnchorElMenu(null);
        setSelectedMemberForAction(null); // 메뉴 닫을 때 선택된 멤버 초기화
    };

    // --- 채팅방 나가기 ---
    const handleOpenLeaveChatConfirm = () => {
        setIsLeaveChatConfirmOpen(true);
        handleMenuClose();
    };
    const handleCloseLeaveChatConfirm = () => setIsLeaveChatConfirmOpen(false);
    const handleLeaveChatRoom = async () => {
        if (!roomId || !currentUserId) return;
        setIsProcessingChatAction(true); setPageError(null);
        try {
            await api.delete(`/api/chat/rooms/${roomId}/leave`);
            alert("채팅방을 나갔습니다.");
            navigate(chatRoomInfo?.studyGroupId ? `/studies/${chatRoomInfo.studyGroupId}` : '/');
        } catch (error: any) {
            setPageError(error.response?.data?.message || "채팅방 나가기 중 오류 발생");
        } finally {
            setIsProcessingChatAction(false);
            setIsLeaveChatConfirmOpen(false);
        }
    };

    // --- 멤버 내보내기 (방장) ---
    const handleOpenRemoveMemberConfirm = (member: ChatRoomMemberInfo) => {
        setSelectedMemberForAction(member);
        setIsRemoveMemberConfirmOpen(true);
        handleMenuClose();
    };
    const handleCloseRemoveMemberConfirm = () => {
        setIsRemoveMemberConfirmOpen(false);
        setSelectedMemberForAction(null);
    };
    // const handleRemoveMember = async () => {
    //     if (!roomId || !selectedMemberForAction || !currentUserId) return;
    //     setIsProcessingChatAction(true); setPageError(null);
    //     try {
    //         await api.delete(`/api/chat/rooms/${roomId}/members/${selectedMemberForAction.id}`);
    //         alert(`${selectedMemberForAction.name}님을 채팅방에서 내보냈습니다.`);
    //         await initializeChatRoomData(); // 멤버 목록 갱신
    //     } catch (error: any) {
    //         setPageError(error.response?.data?.message || "멤버 내보내기 중 오류 발생");
    //     } finally {
    //         setIsProcessingChatAction(false);
    //         handleCloseRemoveMemberConfirm();
    //     }
    // };

    // --- 멤버 초대 ---
    const handleOpenInviteModal = () => {
        setIsInviteModalOpen(true);
        handleMenuClose();
    };
    const handleInviteSuccess = () => {
        initializeChatRoomData(); // 초대 성공 후 멤버 목록 등 갱신
        // TODO: Snackbar로 성공 메시지 표시
    };

    const handleAcceptInvite = async () => {
        if (!roomId) return;
        setIsInviteProcessing(true);
        setPageError(null);
        try {
            await api.post(`/api/chat/rooms/${roomId}/invites/respond?accept=true`);
            await initializeChatRoomData(); // 초대 수락 후 데이터 전체 새로고침
        } catch (error: any) {
            console.error("Error accepting chat invite:", error);
            setPageError(error.response?.data?.message || "초대 수락 중 오류가 발생했습니다.");
        } finally {
            setIsInviteProcessing(false);
        }
    };

    const handleRejectInvite = async () => {
        if (!roomId) return;
        setIsInviteProcessing(true);
        setPageError(null);
        try {
            await api.post(`/api/chat/rooms/${roomId}/invites/respond?accept=false`);
            alert("채팅방 초대를 거절했습니다.");
            navigate(-1); // 또는 스터디 상세 페이지 등으로 이동
        } catch (error: any) {
            console.error("Error rejecting chat invite:", error);
            setPageError(error.response?.data?.message || "초대 거절 중 오류가 발생했습니다.");
        } finally {
            setIsInviteProcessing(false);
        }
    };

    const handleSendMessage = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const currentUserMembership = chatRoomInfo?.members.find(m => m.id === currentUserId);
        if (newMessage.trim() && roomId && currentUserId && currentUserMembership?.status === 'JOINED' && stompClient && stompClient.active && isConnected) {
            sendMessage(Number(roomId), newMessage.trim(), MessageType.TALK);
            setNewMessage('');
        } else {
            console.warn('Cannot send message. Conditions not met:', { /* ... */ });
            if (!isConnected || !stompClient?.active) {
                setPageError("채팅 서버에 연결되지 않았습니다. 잠시 후 다시 시도해주세요.");
            } else if(currentUserMembership?.status !== 'JOINED') {
                setPageError("채팅방에 참여한 후에 메시지를 보낼 수 있습니다.");
            }
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop === 0 && !loadingMessages && hasMoreMessages && roomId && chatRoomInfo?.members.find(m=>m.id === currentUserId)?.status === 'JOINED') {
            fetchPreviousMessages(Number(roomId), currentPage + 1);
        }
    };

    const isCurrentUserRoomAdmin = useMemo(() => {
        if (!chatRoomInfo || !currentUserId) return false;
        // 백엔드 ChatRoomDetailResponse에 studyGroupLeaderId가 내려온다고 가정
        return currentUserId === chatRoomInfo.studyGroupLeaderId;
    }, [chatRoomInfo, currentUserId]);

    const handleOpenManageMembersDialog = () => {
        setIsManageMembersDialogOpen(true);
        handleMenuClose(); // 메인 메뉴 닫기
    };
    const handleCloseManageMembersDialog = () => {
        setIsManageMembersDialogOpen(false);
        setSelectedMemberToRemove(null); // 다이얼로그 닫을 때 선택된 멤버 초기화
    };

    // 내보낼 멤버를 '선택'하는 함수 (실제 내보내기 전 단계)
    const prepareToRemoveMember = (member: ChatRoomMemberInfo) => {
        setSelectedMemberToRemove(member);
        // 여기서 바로 확인 다이얼로그를 띄우거나,
        // 또는 ManageMembersDialog 내에서 "내보내기" 버튼 클릭 시 확인 단계를 거치도록 할 수 있음
        // 여기서는 간단히 console.log로 확인하고, 실제 내보내기는 handleRemoveMember에서
        console.log("내보낼 멤버 선택됨:", member.name);
        // 필요하다면 별도의 확인 다이얼로그를 여기서 열 수 있음:
        // setIsRemoveMemberConfirmDialogOpen(true); (새로운 상태와 다이얼로그 필요)
        // 지금은 ManageMembersDialog에서 직접 내보내기 버튼을 누르면 API 호출하도록 함
    };

    const confirmAndRemoveMember = async (member: ChatRoomMemberInfo) => {
        if (!roomId || !currentUserId || member.id === currentUserId) return;
        const confirmRemove = window.confirm(`정말로 '${member.name}'님을 채팅방에서 내보내시겠습니까?`);
        if (!confirmRemove) return;

        setIsProcessingChatAction(true); setPageError(null);
        try {
            await api.delete(`/api/chat/rooms/${roomId}/members/${member.id}`);
            alert(`${member.name}님을 채팅방에서 내보냈습니다.`);
            await initializeChatRoomData();
        } catch (error: any) {
            setPageError(error.response?.data?.message || "멤버 내보내기 중 오류 발생");
        } finally {
            setIsProcessingChatAction(false);
        }
    };

    // 실제 멤버를 내보내는 API 호출 함수
    const handleRemoveMember = async (memberToRemove: ChatRoomMemberInfo | null) => { // 인자로 받을 수 있도록 변경
        if (!roomId || !memberToRemove || !currentUserId) return;
        if (memberToRemove.id === currentUserId) {
            alert("자기 자신을 내보낼 수 없습니다.");
            return;
        }

        // 추가: 확인 절차
        const confirmRemove = window.confirm(`정말로 '${memberToRemove.name}'님을 채팅방에서 내보내시겠습니까?`);
        if (!confirmRemove) {
            return;
        }

        setIsProcessingChatAction(true);
        setPageError(null);
        try {
            await api.delete(`/api/chat/rooms/${roomId}/members/${memberToRemove.id}`);
            alert(`${memberToRemove.name}님을 채팅방에서 내보냈습니다.`);
            await initializeChatRoomData(); // 멤버 목록 갱신
        } catch (error: any) {
            setPageError(error.response?.data?.message || "멤버 내보내기 중 오류 발생");
        } finally {
            setIsProcessingChatAction(false);
            // setSelectedMemberToRemove(null); // ManageMembersDialog가 닫힐 때 초기화되도록
            // setIsManageMembersDialogOpen(false); // 성공 시 다이얼로그 유지할지 닫을지 결정
        }
    };

    // --- 렌더링 로직 ---

    if (authLoading || loadingPageData) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Container>;
    }

    if (pageError) {
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5, p: 3 }}>
                <Alert severity="error" sx={{mb: 2}}>{pageError}</Alert>
                <Button onClick={() => navigate('/')} variant="outlined">홈으로 돌아가기</Button>
            </Container>
        );
    }

    if (!isLoggedIn) { // AuthContext 로딩 후에도 비로그인 상태
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5, p: 3 }}>
                <Typography variant="h6">로그인이 필요한 페이지입니다.</Typography>
                <Button variant="contained" onClick={() => navigate('/login', {state: {from: location.pathname}})} sx={{mt:2}}>
                    로그인
                </Button>
            </Container>
        );
    }

    if (!chatRoomInfo) { // 데이터 로딩 끝났으나 정보가 없는 경우 (보통 pageError에서 처리됨)
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5, p: 3 }}>
                <Typography>채팅방 정보를 찾을 수 없습니다.</Typography>
                <Button onClick={() => navigate('/')} variant="outlined" sx={{mt: 2}}>홈으로 돌아가기</Button>
            </Container>
        );
    }

    const currentUserMembership = chatRoomInfo.members.find(member => member.id === currentUserId);

    if (!currentUserMembership) { // API 응답에 현재 사용자 정보가 없는 경우 (초대도 안됨)
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5, p: 3 }}>
                <Alert severity="warning" sx={{mb: 2}}>이 채팅방의 멤버가 아닙니다.</Alert>
                <Button onClick={() => navigate('/')} variant="outlined">홈으로 돌아가기</Button>
            </Container>
        );
    }

    if (currentUserMembership.status === 'INVITED') {
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: {xs: 3, sm:5}, p: {xs:2, sm:3}, border: '1px solid #ddd', borderRadius: 2 }}>
                <Typography variant="h5" component="h1" gutterBottom>'{chatRoomInfo.name}' 채팅방 초대</Typography>
                <Typography variant="body1" gutterBottom>이 채팅방에 참여하시겠습니까?</Typography>
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <Button variant="contained" color="primary" onClick={handleAcceptInvite} disabled={isInviteProcessing} sx={{minWidth: 100}}>
                        {isInviteProcessing ? <CircularProgress size={24} color="inherit" /> : '수락'}
                    </Button>
                    <Button variant="outlined" color="inherit" onClick={handleRejectInvite} disabled={isInviteProcessing} sx={{minWidth: 100}}>
                        {isInviteProcessing ? <CircularProgress size={24} color="inherit" /> : '거절'}
                    </Button>
                </Box>
                {/* 초대 응답 관련 에러 메시지 (pageError 사용) */}
            </Container>
        );
    }

    if (currentUserMembership.status !== 'JOINED') {
        return (
            <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 5, p: 3 }}>
                <Alert severity="info" sx={{mb: 2}}>채팅방에 참여할 수 없는 상태입니다 (현재 상태: {currentUserMembership.status}).</Alert>
                <Button onClick={() => navigate('/')} variant="outlined">홈으로 돌아가기</Button>
            </Container>
        );
    }

    // --- JOINED 상태일 때 채팅 UI ---
    return (
        <Container maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', p: 0, bgcolor: 'background.default' }}>
            <AppBar position="static" color="inherit" elevation={1} sx={{flexShrink:0, borderBottom: '1px solid #ddd'}}>
                <Toolbar variant="dense">
                    <IconButton edge="start" color="inherit" onClick={() => navigate(-1)} aria-label="back">
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 1, fontWeight:'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {chatRoomInfo.name}
                    </Typography>
                    <Chip label={`${chatRoomInfo.members.filter(m => m.status === 'JOINED').length}명 참여중`} size="small" variant="outlined" />
                    {/* 메뉴 버튼 */}
                    {isLoggedIn && currentUserMembership?.status === 'JOINED' && ( // JOINED 상태일 때만 메뉴 표시
                        <IconButton
                            edge="end"
                            color="inherit"
                            aria-label="chat room menu"
                            aria-controls="chat-room-menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenuOpen}
                            sx={{ ml: 1 }}
                        >
                            <MoreVertIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: {xs: 1, sm: 2}, bgcolor: 'grey.50' }}>
                <List ref={listRef} onScroll={handleScroll} sx={{pb:1}}>
                    {loadingMessages && currentPage > 0 && (
                        <ListItem sx={{justifyContent: 'center', py:1}}><CircularProgress size={20}/></ListItem>
                    )}
                    {messages.map((msg, index) => {
                        const isMyMessage = msg.sender.id === currentUserId;
                        // 수정: 이전 메시지의 sender ID와 현재 메시지의 sender ID를 비교하고,
                        //       메시지 타입이 TALK일 때만 연속된 메시지로 간주하여 이름/아바타 숨김 처리
                        const isContinuousMessage = index > 0 &&
                            messages[index - 1].sender.id === msg.sender.id &&
                            msg.messageType === MessageType.TALK &&
                            messages[index - 1].messageType === MessageType.TALK;

                        // 수정: showSenderInfo 조건을 isMyMessage가 아닐 때와, 연속된 메시지가 아닐 때로 변경
                        const showSenderInfo = !isMyMessage && !isContinuousMessage;
                        const messageDate = new Date(msg.sentAt);

                        // 방장 아이콘 표시 (msg.sender.id가 chatRoomInfo.studyGroupLeaderId와 같은지 확인)
                        const isSenderAdmin = msg.sender.id === chatRoomInfo?.studyGroupLeaderId;

                        const prevMessageDate = index > 0 ? new Date(messages[index-1].sentAt) : null;
                        const showDateDivider = index === 0 || (prevMessageDate && messageDate.toDateString() !== prevMessageDate.toDateString());

                        return (
                            <React.Fragment key={msg.messageId}>
                                {showDateDivider && (
                                    <Box sx={{display: 'flex', alignItems: 'center', my:2}}>
                                        <Divider sx={{flexGrow:1}} />
                                        <Typography variant="caption" color="textSecondary" sx={{px:1, bgcolor: 'grey.200', borderRadius:1}}>
                                            {messageDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'})}
                                        </Typography>
                                        <Divider sx={{flexGrow:1}} />
                                    </Box>
                                )}
                                {(msg.messageType === MessageType.ENTER || msg.messageType === MessageType.LEAVE) ? (
                                    <Typography variant="caption" color="textSecondary" sx={{textAlign:'center', display:'block', my:1}}>
                                        {msg.content}
                                    </Typography>
                                ) : (
                                    <ListItem
                                        alignItems="flex-start" // Avatar와 메시지 내용을 수직 정렬 (상단 기준)
                                        sx={{
                                            display: 'flex',
                                            flexDirection: isMyMessage ? 'row-reverse' : 'row',
                                            mb: isContinuousMessage && !showDateDivider ? 0.2 : 1,
                                            px:0, // ListItem 자체 패딩 제거
                                        }}
                                    >
                                        {/* 수정: 상대방 메시지이고, showSenderInfo가 true일 때만 아바타 표시 */}
                                        {!isMyMessage && showSenderInfo && (
                                            <ListItemAvatar sx={{ minWidth: 'auto', mr: 1, mt:0.5, alignSelf: 'flex-start' }}>
                                                <Avatar
                                                    src={msg.sender.profileImageUrl || undefined}
                                                    alt={msg.sender.name}
                                                    sx={{width:32, height:32}}
                                                >
                                                    {/* 수정: 프로필 이미지 없을 때 이름 이니셜 (null 체크 추가) */}
                                                    {!msg.sender.profileImageUrl && msg.sender.name ? msg.sender.name[0].toUpperCase() : null}
                                                </Avatar>
                                            </ListItemAvatar>
                                        )}
                                        {/* 수정: 내 메시지이거나, 상대방의 연속된 메시지일 때 아바타 공간 확보 (아바타 숨김 시) */}
                                        {(isMyMessage || (!isMyMessage && !showSenderInfo)) && (
                                            <Box sx={{width: (!isMyMessage && !showSenderInfo) ? (32 + 8) : 0 }} /> // 상대방 연속 메시지 시 아바타 너비만큼 공간
                                        )}


                                        <Box sx={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: isMyMessage ? 'flex-end' : 'flex-start',
                                            maxWidth: '75%', // 메시지 최대 너비
                                        }}>
                                            {/* 수정: 상대방 메시지이고, showSenderInfo가 true일 때만 이름 표시 */}
                                            {!isMyMessage && showSenderInfo && (
                                                <Box sx={{display: 'flex', alignItems: 'center', mb:0.3, ml: '2px'}}>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {msg.sender.name}
                                                    </Typography>
                                                    {isSenderAdmin && <CrownIcon sx={{ fontSize: '1rem', ml: 0.5, color: 'gold' }} />} {/* 방장 왕관 아이콘 */}
                                                </Box>
                                            )}
                                            <Box sx={{display:'flex', alignItems:'flex-end', gap:0.5, flexDirection: isMyMessage ? 'row-reverse':'row'}}>
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: '8px 12px',
                                                        borderRadius: isMyMessage ? '12px 0px 12px 12px' : '0px 12px 12px 12px', // 말꼬리 모양
                                                        bgcolor: isMyMessage ? 'primary.main' : 'background.paper',
                                                        color: isMyMessage ? 'primary.contrastText' : 'text.primary',
                                                        wordBreak: 'break-word',
                                                        border: !isMyMessage ? '1px solid #e0e0e0' : 'none',
                                                    }}
                                                >
                                                    <Typography variant="body2">{msg.content}</Typography>
                                                </Paper>
                                                <Typography variant="caption" color="text.secondary" sx={{whiteSpace: 'nowrap'}}>
                                                    {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </ListItem>
                                )}
                            </React.Fragment>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </List>
            </Box>

            <Paper elevation={3} sx={{ p: 1.5, display: 'flex', alignItems: 'center', borderTop: '1px solid #ccc', flexShrink:0, bgcolor:'background.paper' }}>
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
                <IconButton color="primary" onClick={() => handleSendMessage()} disabled={!newMessage.trim() || !isConnected}>
                    <SendIcon />
                </IconButton>
            </Paper>

            {/* 채팅방 작업 메뉴 */}
            <Menu
                id="chat-room-menu-appbar"
                anchorEl={anchorElMenu}
                open={Boolean(anchorElMenu)}
                onClose={handleMenuClose}
                MenuListProps={{ 'aria-labelledby': 'chat-actions-button' }}
                sx={{mt: '40px'}}
            >
                {isCurrentUserRoomAdmin && ( // 방장/관리자 전용 메뉴
                    <MenuItem onClick={handleOpenInviteModal}>
                        <MuiListItemIcon><PersonAddIcon fontSize="small" /></MuiListItemIcon>
                        멤버 초대
                    </MenuItem>
                )}
                {isCurrentUserRoomAdmin && (
                    <MenuItem onClick={handleOpenManageMembersDialog}>
                        <MuiListItemIcon><PersonRemoveIcon fontSize="small" color="error" /></MuiListItemIcon> 멤버 내보내기
                    </MenuItem>
                )}
                {/* 방장이 아닌 경우에만 나가기 버튼을 보여주거나, 방장도 나갈 수 있게 하려면 조건 제거 또는 수정 */}
                {/* 현재: 모든 JOINED 멤버가 나갈 수 있음 */}
                <MenuItem onClick={handleOpenLeaveChatConfirm} sx={{color: 'error.main'}}>
                    <MuiListItemIcon><ExitToAppIcon fontSize="small" color="error" /></MuiListItemIcon> 채팅방 나가기
                </MenuItem>
            </Menu>

            {/* 채팅방 나가기 확인 다이얼로그 */}
            <Dialog open={isLeaveChatConfirmOpen} onClose={handleCloseLeaveChatConfirm}>
                <DialogTitle>채팅방 나가기</DialogTitle>
                <DialogContent><DialogContentText>정말로 '{chatRoomInfo?.name}' 채팅방에서 나가시겠습니까?</DialogContentText></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseLeaveChatConfirm} disabled={isProcessingChatAction}>취소</Button>
                    <Button onClick={handleLeaveChatRoom} color="error" variant="contained" disabled={isProcessingChatAction}>
                        {isProcessingChatAction ? <CircularProgress size={20} color="inherit"/> : '나가기'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 멤버 관리(내보내기) 다이얼로그 */}
            <Dialog open={isManageMembersDialogOpen} onClose={handleCloseManageMembersDialog} maxWidth="xs" fullWidth>
                <DialogTitle>채팅방 멤버 관리 (내보내기)</DialogTitle>
                <DialogContent dividers sx={{pt:1}}>
                    {chatRoomInfo?.members && chatRoomInfo.members.filter(m => m.status === 'JOINED' && m.id !== currentUserId).length > 0 ? (
                        <List dense>
                            {chatRoomInfo.members
                                .filter(member => member.id !== currentUserId && member.status === 'JOINED') // 자신 제외, JOINED 멤버만
                                .map(member => (
                                    <ListItem
                                        key={member.id}
                                        secondaryAction={
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                color="error"
                                                onClick={() => handleRemoveMember(member)} // 수정: 바로 API 호출
                                                disabled={isProcessingChatAction}
                                                startIcon={isProcessingChatAction && selectedMemberToRemove?.id === member.id ? <CircularProgress size={16} sx={{mr:0.5}}/> : <PersonRemoveIcon fontSize="small"/>}
                                            >
                                                내보내기
                                            </Button>
                                        }
                                        sx={{pl:0}}
                                    >
                                        <ListItemAvatar>
                                            <Avatar src={member.profileImageUrl || undefined} sx={{width: 32, height: 32}}>
                                                {!member.profileImageUrl && member.name ? member.name[0].toUpperCase() : null}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText primary={member.name} secondary={member.id === chatRoomInfo.studyGroupLeaderId ? "스터디장" : "멤버"} />
                                    </ListItem>
                                ))}
                        </List>
                    ) : (
                        <Typography color="textSecondary" textAlign="center" sx={{py:2}}>내보낼 수 있는 다른 멤버가 없습니다.</Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseManageMembersDialog}>닫기</Button>
                </DialogActions>
            </Dialog>

            {/* 멤버 초대 모달 */}
            {chatRoomInfo && ( // chatRoomInfo가 있어야 studyGroupId 전달 가능
                <InviteToChatRoomModal
                    open={isInviteModalOpen}
                    onClose={() => setIsInviteModalOpen(false)}
                    chatRoomId={chatRoomInfo.id}
                    studyGroupId={chatRoomInfo.studyGroupId}
                    onInviteSuccess={handleInviteSuccess}
                />
            )}
        </Container>
    );
};

export default ChatRoomPage;