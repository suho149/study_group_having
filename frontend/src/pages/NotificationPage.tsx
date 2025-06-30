import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert, ListItemButton, // Alert 추가
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {Notification, NotificationType, NotificationTypeStrings} from '../types/notification'; // 공통 타입 사용

// 그룹화된 알림을 위한 새로운 타입 정의
interface GroupedNotification extends Notification {
  isGrouped: boolean;
  count: number;
  senders: string[];
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null); // 페이지 레벨 에러
  const navigate = useNavigate();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifResponse, countResponse] = await Promise.all([
        api.get<Notification[]>('/api/notifications'),
        api.get<number>('/api/notifications/unread-count')
      ]);
      setUnreadCount(countResponse.data);

      // DM 그룹화 로직 (NotificationPage와 동일)
      const groupedNotifications = new Map<string, GroupedNotification>();
      notifResponse.data.forEach(n => {
        if (n.type === NotificationType.NEW_DM) {
          // ... (이전과 동일한 DM 그룹화 로직)
        } else {
          groupedNotifications.set(`notification-${n.id}`, { ...n, isGrouped: false, count: 1, senders: [n.senderName] });
        }
      });
      const finalNotifications = Array.from(groupedNotifications.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setNotifications(finalNotifications);

    } catch (error) {
      console.error('알림 데이터 조회 실패 (Navbar):', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- 네비게이션 경로를 결정하는 헬퍼 함수 ---
  const getNavigationPath = (notification: GroupedNotification): string => {
    const type = notification.type;
    const refId = notification.referenceId;
    if (!refId) return '/mypage/notifications';

    switch (type) {
      case NotificationType.NEW_DM: return `/dm/room/${refId}`;
      case NotificationType.CHAT_INVITE: return `/chat/room/${refId}`;
      case NotificationType.STUDY_INVITE:
      case NotificationType.JOIN_APPROVED:
      case NotificationType.STUDY_JOIN_REQUEST:
        return `/studies/${refId}`;
      case NotificationType.NEW_LIKE_ON_POST:
      case NotificationType.NEW_COMMENT_ON_POST:
      case NotificationType.NEW_REPLY_ON_COMMENT: return `/board/post/${refId}`;
      case NotificationType.NEW_FEED: return `/mypage/feed`;
      default: return '/mypage/notifications';
    }
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setPageError(null); // 조회 시작 시 이전 에러 초기화
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      const groupedNotifications = new Map<string, GroupedNotification>();
      response.data.forEach(n => {
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

      const finalNotifications = Array.from(groupedNotifications.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(finalNotifications);
    } catch (error: any) {
      console.error('알림 조회 실패:', error);
      setPageError(error.response?.data?.message || "알림을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationAction = async (notificationToHandle: Notification, accept: boolean) => {
    const currentNotification = notifications.find(n => n.id === notificationToHandle.id);

    if ((currentNotification && currentNotification.isRead) || processingNotificationId === notificationToHandle.id) {
      return;
    }
    if (notificationToHandle.referenceId === null) {
      alert('관련 정보를 찾을 수 없어 알림을 처리할 수 없습니다.');
      return;
    }

    setProcessingNotificationId(notificationToHandle.id);
    setPageError(null); // 액션 시작 시 이전 에러 초기화

    try {
      let apiEndpoint = '';
      let payload: any = {};
      let actionTaken = false;

      if (notificationToHandle.type === 'STUDY_INVITE') {
        apiEndpoint = `/api/studies/${notificationToHandle.referenceId}/invite/response`;
        payload = { accept };
        await api.post(apiEndpoint, payload);
        actionTaken = true;
      } else if (notificationToHandle.type === 'CHAT_INVITE') {
        apiEndpoint = `/api/chat/rooms/${notificationToHandle.referenceId}/invites/respond?accept=${accept}`;
        await api.post(apiEndpoint);
        actionTaken = true;
      } else if (notificationToHandle.type === 'FRIEND_REQUEST') {
        // friendshipId는 이 경우 referenceId가 아닌, 별도의 테이블 ID.
        // 이 알림을 처리하려면 Friendship ID가 필요하므로, Notification의 referenceId에 friendshipId를 저장해야 함.
        // 백엔드 FriendshipService의 sendFriendRequest에서 Notification 생성 시 friendship.getId()를 referenceId로 넘겨줘야 함.
        if (accept) {
          await api.post(`/api/friends/accept/${notificationToHandle.referenceId}`);
        } else {
          await api.delete(`/api/friends/request/${notificationToHandle.referenceId}`);
        }
        actionTaken = true;
      } else {
        console.warn("Unhandled actionable notification type for action:", notificationToHandle.type);
        setProcessingNotificationId(null);
        return;
      }

      if (actionTaken) {
        // 로컬 상태 즉시 업데이트 (UI 즉각 반응용)
        setNotifications(prevNotifications =>
            prevNotifications.map(n =>
                n.id === notificationToHandle.id
                    ? { ...n, isRead: true }
                    : n
            )
        );

        // 백엔드가 초대 응답 시 isRead를 자동으로 업데이트하지 않는 경우,
        // 여기서 명시적으로 읽음 처리 API를 호출할 수 있습니다.
        // (하지만 중복 호출이 될 수 있으므로 백엔드에서 처리하는 것이 가장 좋음)
        // try {
        //   await api.patch(`/api/notifications/${notificationToHandle.id}/read`);
        // } catch (readError) {
        //   console.error("알림 읽음 처리 중 에러(액션 후):", readError);
        // }


        if (accept) {
          if (notificationToHandle.type === 'CHAT_INVITE') navigate(`/chat/room/${notificationToHandle.referenceId}`);
          else if (notificationToHandle.type === 'STUDY_INVITE') navigate(`/studies/${notificationToHandle.referenceId}`);
        }
        // (선택적) 서버와 최종 동기화를 위해 목록을 다시 불러올 수 있음.
        // 하지만 로컬 업데이트로도 UI는 변경됨.
        // await fetchNotifications();
      }
    } catch (error: any) {
      console.error('알림 처리 실패:', error);
      const errorMessage = error.response?.data?.message || error.message || "알림 처리 중 오류가 발생했습니다.";
      setPageError(errorMessage); // 에러 상태 설정
      // 에러 발생 시에는 로컬 상태 롤백을 고려하거나, 사용자에게 에러를 명확히 알림
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const handleGeneralNotificationClick = async (notification: GroupedNotification) => {
    // 1. 먼저 이동할 경로를 계산합니다.
    const path = getNavigationPath(notification);

    // 2. 페이지를 즉시 이동시킵니다.
    //    (isActionable 로직과 충돌하지 않도록, 이 함수는 isActionable이 false일 때만 호출됩니다)
    navigate(path);

    // 3. 페이지 이동 후에, 백그라운드에서 읽음 처리와 데이터 새로고침을 수행합니다.
    try {
      if (notification.isGrouped && notification.type === NotificationType.NEW_DM && notification.referenceId) {
        await api.patch(`/api/notifications/read/dm/${notification.referenceId}`);
      }
      else if (!notification.isRead) {
        await api.patch(`/api/notifications/${notification.id}/read`);
      }

      // API 호출이 완료된 후 목록을 새로고침합니다.
      // 페이지가 이미 이동했기 때문에, 이 컴포넌트가 언마운트된 후 실행될 수 있습니다.
      // 따라서 isMounted와 같은 상태로 제어하면 더 안전하지만, 현재 구조에서는 큰 문제가 없습니다.
      fetchAllData();

    } catch (error) {
      console.error('알림 클릭 처리 실패:', error);
      // 사용자에게 에러를 알리는 로직을 추가할 수 있습니다 (예: snackbar)
    }
  };


  const getNotificationActions = (notification: Notification) => {

    console.log("isRead = ", notification.isRead)
    // isRead가 true이면 버튼을 아예 표시하지 않음
    if (notification.isRead) { // <--- isRead가 true면 바로 null 반환
      console.log("isRead = true")
      return null;
    }

    // 현재 이 알림이 처리 중인지 여부 판단
    const isCurrentlyProcessing = processingNotificationId === notification.id;

    if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE' || notification.type === 'FRIEND_REQUEST') {
      return (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
                variant="contained" color="primary" size="small"
                onClick={() => handleNotificationAction(notification, true)}
                disabled={isCurrentlyProcessing} // <--- isCurrentlyProcessing 사용
                sx={{minWidth: 80}} // 버튼 크기 약간 조정
            >
              {isCurrentlyProcessing ? <CircularProgress size={16} color="inherit" /> : '수락'}
            </Button>
            <Button
                variant="outlined" color="secondary" size="small"
                onClick={() => handleNotificationAction(notification, false)}
                disabled={isCurrentlyProcessing} // <--- isCurrentlyProcessing 사용
                sx={{minWidth: 80}} // 버튼 크기 약간 조정
            >
              {isCurrentlyProcessing ? <CircularProgress size={16} color="inherit" /> : '거절'}
            </Button>
          </Box>
      );
    }
    return null;
  };

  const getStatusChip = (notification: GroupedNotification) => {
    // 그룹화된 DM 알림일 경우 특별한 칩 표시
    // 그룹화된 DM 알림
    if (notification.isGrouped && notification.type === NotificationType.NEW_DM) {
      // 안 읽은 메시지가 하나라도 있으면 '새 메시지' 칩 표시
      if (notification.count > 0) {
        return <Chip label={`+${notification.count} 새 메시지`} size="small" color="primary" />;
      }
      // 모두 읽었으면 '확인함' 칩 표시
      return <Chip label="확인함" size="small" variant="outlined" />;
    }
    if (notification.isRead) {
      if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
        return <Chip label="응답함" size="small" color="default" variant="outlined" />;
      }
      return <Chip label="읽음" size="small" color="default" variant="outlined" />;
    }

    switch (notification.type) {
      case 'STUDY_INVITE': return <Chip label="새 스터디 초대" size="small" color="info" />;
      case 'CHAT_INVITE': return <Chip label="새 채팅 초대" size="small" color="info" />;
      case 'INVITE_ACCEPTED': case 'JOIN_APPROVED': return <Chip label="수락됨" size="small" color="success" />;
      case 'INVITE_REJECTED': case 'JOIN_REJECTED': return <Chip label="거절됨" size="small" color="error" />;
      case 'STUDY_JOIN_REQUEST': return <Chip label="참여 요청" size="small" color="warning" />;
      default: return <Chip label="새 알림" size="small" color="primary" />;
    }
  };

  if (loading) {
    return (
        <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
    );
  }

  return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{mb:3}}>
          알림
        </Typography>

        {pageError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPageError(null)}>
              {pageError}
            </Alert>
        )}

        <Paper elevation={1} sx={{borderRadius: 2}}>
          <List sx={{p:0}}>
            {notifications.length === 0 ? (
                <ListItem sx={{justifyContent:'center', py:3}}>
                  <Typography color="textSecondary">새로운 알림이 없습니다.</Typography>
                </ListItem>
            ) : (
                notifications.map((notification, index) => {
                  const isActionable = !notification.isRead && (notification.type === NotificationType.STUDY_INVITE || notification.type === NotificationType.CHAT_INVITE);

                  // 고유하고 일관된 key 생성
                  const uniqueKey = notification.isGrouped
                      ? `group-${notification.type}-${notification.referenceId}`
                      : `item-${notification.id}`;

                  return (
                      <React.Fragment key={uniqueKey}>
                        <ListItem
                            disablePadding
                            secondaryAction={getStatusChip(notification)}
                        >
                          <ListItemButton
                              onClick={!isActionable ? () => handleGeneralNotificationClick(notification) : undefined}
                              sx={{ py: 1.5, px: 2, cursor: !isActionable ? 'pointer' : 'default' }}
                          >
                            <ListItemText
                                primary={notification.message}
                                primaryTypographyProps={{ variant: 'body1', sx: { fontWeight: !notification.isRead ? 500 : 'normal', pr: '90px' } }}
                                secondaryTypographyProps={{
                                  // secondary 텍스트를 렌더링할 때 사용할 컴포넌트를 span으로 지정
                                  component: 'div' // 또는 span. 여기서는 자식으로 Box가 오므로 div가 더 적합.
                                }}
                                secondary={
                                  <>
                                    <Typography variant="caption" color="text.secondary" component="span"> {/* p가 아닌 span으로 렌더링 */}
                                      {notification.isGrouped
                                          ? `가장 최근 발신자: ${notification.senderName}`
                                          : `${notification.senderName} • ${new Date(notification.createdAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour:'2-digit', minute:'2-digit' })}`
                                      }
                                    </Typography>
                                    {/* getNotificationActions가 <Box>를 반환하므로, 이 구조 전체를 <div>로 감싸는 것이 시맨틱적으로 맞음 */}
                                    {getNotificationActions(notification)}
                                  </>
                                }
                            />
                          </ListItemButton>
                        </ListItem>
                        {index < notifications.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                  );
                })
            )}
          </List>
        </Paper>
      </Container>
  );
};

export default NotificationPage;