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
import {Notification, NotificationType, NotificationTypeStrings} from '../../types/notification'; // 공통 타입 사용

// NotificationPage와 동일한 그룹화된 알림 타입을 사용
interface GroupedNotification extends Notification {
  isGrouped: boolean;
  count: number;
  senders: string[];
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // <--- loading 상태 추가
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get<number>('/api/notifications/unread-count');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('읽지 않은 알림 수 조회 실패 (Navbar):', error);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 알림 목록과 안 읽은 수를 동시에 API로 요청합니다.
      const [notifResponse, countResponse] = await Promise.all([
        api.get<Notification[]>('/api/notifications'),
        api.get<number>('/api/notifications/unread-count')
      ]);
      setUnreadCount(countResponse.data);

      // 2. 받아온 알림 목록을 그룹화하는 로직을 수행합니다.
      const groupedNotifications = new Map<string, GroupedNotification>();
      notifResponse.data.forEach(n => {
        // 1. DM 알림일 경우 (읽음 여부와 상관없이) 그룹화 시도
        if (n.type === NotificationType.NEW_DM) {
          const groupKey = `dm-room-${n.referenceId}`;
          const existing = groupedNotifications.get(groupKey);

          if (existing) {
            // 이미 읽은 그룹에 새로운 안읽은 메시지가 포함될 수 있으므로, isRead 상태는 AND 논리로 결정
            existing.isRead = existing.isRead && n.isRead;

            // 안 읽은 메시지만 카운트
            if (!n.isRead) {
              existing.count++;
              if (!existing.senders.includes(n.senderName)) {
                existing.senders.push(n.senderName);
              }
            }
            // 그룹의 대표 시간은 항상 최신 알림의 시간으로 업데이트
            if (new Date(n.createdAt) > new Date(existing.createdAt)) {
              existing.createdAt = n.createdAt;
              existing.message = `'${n.senderName}'님과의 대화`; // 메시지도 최신 정보로
            }
          } else {
            groupedNotifications.set(groupKey, {
              ...n,
              isGrouped: true,
              count: n.isRead ? 0 : 1, // 읽었으면 카운트 0, 안읽었으면 1
              senders: [n.senderName],
              // 메시지 내용을 "A님과의 대화" 와 같이 통일성있게 변경
              message: `'${n.senderName}'님과의 대화`
            });
          }
        } else {
          groupedNotifications.set(`notification-${n.id}`, { ...n, isGrouped: false, count: 1, senders: [n.senderName] });
        }
      });

      // 3. 그룹화된 결과를 최종적으로 상태에 저장합니다.
      const finalNotifications = Array.from(groupedNotifications.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(finalNotifications);

    } catch (error) {
      console.error('알림 데이터 조회 실패 (Navbar):', error);
    } finally {
      setLoading(false);
    }
    // 4. 의존성 배열에서 fetchNotifications, fetchUnreadCount를 제거합니다.
  }, []);

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

  const handleGeneralNotificationClick = async (notification: GroupedNotification) => {
    try {
      // 1. 클릭된 알림이 그룹화된 DM 알림인 경우
      if (notification.isGrouped && notification.type === NotificationType.NEW_DM && notification.referenceId) {
        // 새로 만든 그룹 읽음 처리 API를 호출
        await api.patch(`/api/notifications/read/dm/${notification.referenceId}`);
      }
      // 2. 그 외의 일반 알림인 경우
      else if (!notification.isRead) {
        // 기존의 단일 알림 읽음 처리 API를 호출
        await api.patch(`/api/notifications/${notification.id}/read`);
      }

      // API 호출 성공 후, 최신 알림 상태를 다시 불러와 UI를 갱신
      fetchAllData();

      // --- 페이지 이동 로직 ---
      if (notification.type === NotificationType.NEW_DM && notification.referenceId) {
        navigate(`/dm/room/${notification.referenceId}`);
      } else if (
          (notification.type === NotificationType.STUDY_INVITE ||
              notification.type === NotificationType.JOIN_APPROVED) &&
          notification.referenceId
      ) {
        navigate(`/studies/${notification.referenceId}`);
      }
      // ... 다른 타입에 대한 네비게이션 로직

      handleClose(); // 메뉴 닫기

    } catch (error) {
      console.error('알림 클릭 처리 실패 (Navbar):', error);
    }
  };

  const getNotificationActionsForList = (notification: Notification) => {
    if (notification.isRead) return null;
    const isCurrentlyProcessing = processingNotificationId === notification.id;
    if (notification.type === NotificationType.STUDY_INVITE || notification.type === NotificationType.CHAT_INVITE) {
      return (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
                variant="contained" color="primary" size="small"
                onClick={(e) => { e.stopPropagation(); handleInviteResponseAction(notification, true); }}
                disabled={processingNotificationId !== null}
                sx={{minWidth: 60}}
            >
              {isCurrentlyProcessing ? <CircularProgress size={16} /> : '수락'}
            </Button>
            <Button
                variant="outlined" color="inherit" size="small"
                onClick={(e) => { e.stopPropagation(); handleInviteResponseAction(notification, false); }}
                disabled={processingNotificationId !== null}
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
                  const isActionable = !notification.isRead && (notification.type === NotificationType.STUDY_INVITE || notification.type === NotificationType.CHAT_INVITE);

                  // 1. 고유하고 일관된 key를 생성합니다.
                  const uniqueKey = notification.isGrouped
                      ? `group-${notification.type}-${notification.referenceId}`
                      : `item-${notification.id}`;

                  return (
                      <React.Fragment key={uniqueKey}>
                        <ListItem
                            disablePadding
                            secondaryAction={getStatusChipForList(notification)}
                        >
                          <ListItemButton
                              // 그룹화된 알림을 포함한 모든 읽지 않은 일반 알림은 클릭 가능
                              onClick={!isActionable ? () => handleGeneralNotificationClick(notification) : undefined}
                              sx={{ py: 1.5, px: 2, cursor: !isActionable ? 'pointer' : 'default' }}
                          >
                            <ListItemText
                                primary={notification.message}
                                primaryTypographyProps={{ variant: 'body2', sx: { fontWeight: !notification.isRead ? 500 : 'normal', whiteSpace: 'normal', wordBreak: 'break-word', pr: '90px' } }}
                                secondaryTypographyProps={{ component: 'div' }}
                                secondary={
                                  <>
                                    <Typography variant="caption" color="textSecondary" component="div" sx={{mt: 0.5}}>
                                      {notification.isGrouped
                                          ? `가장 최근 발신자: ${notification.senderName}`
                                          : `${notification.senderName} • ${new Date(notification.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}`
                                      }
                                    </Typography>
                                    {getNotificationActionsForList(notification)}
                                  </>
                                }
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < arr.length - 1 && <Divider component="li" />}
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