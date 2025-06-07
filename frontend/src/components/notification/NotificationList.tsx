import React, {useState, useEffect, useCallback} from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
  Box,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Notification, NotificationTypeStrings } from '../../types/notification'; // 공통 타입 사용

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // <--- loading 상태 추가
  const navigate = useNavigate();

  // 데이터 로딩 함수들을 useCallback으로 감싸서 참조 안정성 확보
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('알림 목록 조회 실패 (Navbar):', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<number>('/api/notifications/unread-count');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('읽지 않은 알림 수 조회 실패 (Navbar):', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true); // <--- 로딩 시작
    await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    setLoading(false); // <--- 로딩 종료
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]); // fetchAllData 참조가 변경될 때만 (사실상 마운트 시 1회)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchAllData(); // 메뉴 열 때마다 최신 정보로 갱신
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleInviteResponseAction = async (notification: Notification, accept: boolean) => {
    if (notification.isRead || processingNotificationId === notification.id || notification.referenceId === null) {
      return;
    }
    setProcessingNotificationId(notification.id);
    try {
      let apiCalled = false; // API가 실제로 호출되었는지 추적
      if (notification.type === 'STUDY_INVITE') {
        await api.post(`/api/studies/${notification.referenceId}/invite/response`, { accept });
        apiCalled = true;
      } else if (notification.type === 'CHAT_INVITE') {
        await api.post(`/api/chat/rooms/${notification.referenceId}/invites/respond?accept=${accept}`);
        apiCalled = true;
      } else {
        setProcessingNotificationId(null);
        return;
      }

      if (apiCalled) {
        // 로컬 상태 즉시 업데이트
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // 2. 서버로부터 최신 데이터 가져오기 (권장)
        await fetchAllData(); // fetchNotifications와 fetchUnreadCount 모두 호출

        if (accept) {
          if (notification.type === 'CHAT_INVITE') navigate(`/chat/room/${notification.referenceId}`);
          else if (notification.type === 'STUDY_INVITE') navigate(`/studies/${notification.referenceId}`);
        }
        // handleClose(); // 메뉴 닫기는 사용자가 직접 하도록 두거나, 액션 성공 후 자동으로 닫도록 결정
      }
    } catch (error: any) {
      console.error('초대 응답 처리 실패 (Navbar):', error);
      alert(`초대 응답 처리 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleGeneralNotificationClick = async (notification: Notification) => {
    // 초대 관련 알림은 버튼으로 처리하므로, 여기서는 일반 알림 클릭 시 동작 정의
    if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
      // 버튼이 있는 초대 알림의 경우, ListItem 클릭 시의 기본 동작을 막거나 다르게 처리 가능
      // 예를 들어, 바로 페이지로 이동하지 않고 메뉴만 닫도록 할 수 있음
      if (!notification.isRead) { // 아직 안 읽은 초대 알림을 그냥 클릭한 경우
        // 읽음 처리만 하고 메뉴는 유지하거나, 페이지로 이동은 버튼으로만 유도
      }
      // return; // 버튼이 있으므로 ListItem 전체 클릭에 대한 액션은 생략 가능
    }

    try {
      if (!notification.isRead) {
        await api.patch(`/api/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // 특정 타입에 따른 페이지 이동 로직
      if (notification.type === 'JOIN_APPROVED' || notification.type === 'INVITE_ACCEPTED') {
        // 메시지 내용으로 스터디/채팅 구분은 임시방편. referenceType 등이 있다면 그것 사용
        if (String(notification.message).toLowerCase().includes("스터디")) {
          navigate(notification.referenceId ? `/studies/${notification.referenceId}` : '/');
        } else if (String(notification.message).toLowerCase().includes("채팅방")) {
          navigate(notification.referenceId ? `/chat/room/${notification.referenceId}` : '/');
        }
      } else if (notification.type === 'STUDY_JOIN_REQUEST' && notification.referenceId) { // 스터디장이 참여 신청 알림 클릭
        navigate(`/studies/${notification.referenceId}`); // 해당 스터디 상세로 이동하여 멤버 관리
      }
      // TODO: 다른 알림 타입에 대한 네비게이션 로직 추가

      handleClose(); // 알림 클릭 후 메뉴 닫기
    } catch (error) {
      console.error('알림 클릭 처리 실패 (Navbar):', error);
    }
  };

  const getNotificationActionsForList = (notification: Notification) => {
    if (notification.isRead || processingNotificationId === notification.id) {
      return null;
    }
    if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
      return (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, width: '100%', justifyContent: 'flex-end' }}>
            <Button
                variant="contained" color="primary" size="small"
                onClick={(e) => { e.stopPropagation(); handleInviteResponseAction(notification, true); }}
                disabled={processingNotificationId === notification.id}
                sx={{minWidth: 60}}
            >
              {processingNotificationId === notification.id ? <CircularProgress size={16} color="inherit" sx={{mr:0.5}}/> : '수락'}
            </Button>
            <Button
                variant="outlined" color="secondary" size="small"
                onClick={(e) => { e.stopPropagation(); handleInviteResponseAction(notification, false); }}
                disabled={processingNotificationId === notification.id}
                sx={{minWidth: 60}}
            >
              거절
            </Button>
          </Box>
      );
    }
    return null;
  };

  const getStatusChipForList = (notification: Notification) => {
    if (notification.isRead) {
      if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
        return <Chip label="응답함" size="small" variant="outlined" />;
      }
      return <Chip label="읽음" size="small" variant="outlined" />;
    }
    switch (notification.type) {
      case 'STUDY_INVITE': return <Chip label="새 스터디 초대" size="small" color="info" variant="filled" />;
      case 'CHAT_INVITE': return <Chip label="새 채팅 초대" size="small" color="info" variant="filled" />;
      case 'INVITE_ACCEPTED':
      case 'JOIN_APPROVED': return <Chip label="수락됨" size="small" color="success" variant="outlined" />;
      case 'INVITE_REJECTED':
      case 'JOIN_REJECTED': return <Chip label="거절됨" size="small" color="error" variant="outlined" />;
      default: return <Chip label="새 알림" size="small" color="primary" variant="filled" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // 알림을 읽음으로 표시
      if (!notification.isRead) {
        await api.patch(`/api/notifications/${notification.id}/read`);
        fetchUnreadCount();
      }

      // 알림 타입에 따른 처리
      if (notification.type === 'STUDY_INVITE') {
        navigate(`/studies/${notification.referenceId}`);
      }

      handleClose();
    } catch (error) {
      console.error('알림 처리 실패:', error);
    }
  };

  return (
      <>
        <IconButton color="inherit" onClick={handleClick} aria-label="show new notifications">
          <Badge badgeContent={unreadCount > 0 ? unreadCount : null} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{ style: { maxHeight: 400, width: 360, overflowY: 'auto' }}} // maxHeight 조정
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">알림</Typography>
            {notifications.length > 0 && ( // 알림이 있을 때만 "모두 보기" 버튼 표시
                <Button size="small" onClick={() => {navigate('/notifications'); handleClose();}}>모두 보기</Button>
            )}
          </Box>
          <Divider />
          {loading && notifications.length === 0 ? ( // 로딩 중이고 알림이 없을 때
              <Box sx={{display:'flex', justifyContent:'center', alignItems:'center', p:3}}>
                <CircularProgress size={24} />
              </Box>
          ) : notifications.length === 0 ? (
              <MenuItem onClick={handleClose} sx={{justifyContent: 'center', py:2}}>
                <Typography color="textSecondary">새로운 알림이 없습니다.</Typography>
              </MenuItem>
          ) : (
              <List sx={{p:0}}>
                {notifications.slice(0, 7).map((notification, index, arr) => {
                  const isActionableInvite = !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE');
                  const listItemShouldBeButton = !isActionableInvite; // 액션 버튼이 없을 때만 ListItem 전체가 버튼 역할

                  // ListItem에 전달할 props 객체 생성
                  const listItemProps: any = { // 타입을 any로 하거나, ListItemProps에서 button을 제외한 타입을 명시
                    onClick: listItemShouldBeButton ? () => handleGeneralNotificationClick(notification) : undefined,
                    sx: {
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      backgroundColor: !notification.isRead ? 'action.hover' : 'inherit',
                      py: 1.5, px:2,
                      cursor: listItemShouldBeButton ? 'pointer' : 'default',
                    },
                  };

                  // listItemShouldBeButton이 true일 때만 button prop을 추가
                  if (listItemShouldBeButton) {
                    listItemProps.button = true;
                  }

                  return (
                      <React.Fragment key={notification.id}>
                        <ListItem {...listItemProps}> {/* 수정된 listItemProps 사용 */}
                          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb:0.5 }}>
                            <ListItemText
                                primary={notification.message}
                                primaryTypographyProps={{
                                  variant: 'body2',
                                  sx: { fontWeight: !notification.isRead ? 500 : 'normal', whiteSpace: 'normal', wordBreak: 'break-word' }
                                }}
                                sx={{m:0, flexGrow:1, mr:1}}
                            />
                            {getStatusChipForList(notification)}
                          </Box>
                          <Typography variant="caption" color="textSecondary" component="div" sx={{width:'100%'}}>
                            {notification.senderName && `${notification.senderName} • `}
                            {new Date(notification.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}
                          </Typography>
                          {getNotificationActionsForList(notification)}
                        </ListItem>
                        {index < arr.slice(0, 7).length - 1 && <Divider component="li" variant="middle" />}
                      </React.Fragment>
                  );
                })}
              </List>
          )}
          {notifications.length > 7 && (
              <MenuItem onClick={() => {navigate('/notifications'); handleClose();}} sx={{justifyContent: 'center', borderTop: '1px solid #eee'}}>
                <Typography color="primary" variant="body2">알림 전체 보기</Typography>
              </MenuItem>
          )}
        </Menu>
      </>
  );
};

export default NotificationList; 