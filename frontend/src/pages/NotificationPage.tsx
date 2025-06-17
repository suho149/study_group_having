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
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null); // 페이지 레벨 에러
  const navigate = useNavigate();

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
    try {
      // 1. 클릭된 알림이 그룹화된 DM 알림인 경우
      if (notification.isGrouped && notification.type === NotificationType.NEW_DM && notification.referenceId) {
        // 그룹 읽음 처리 API를 호출
        await api.patch(`/api/notifications/read/dm/${notification.referenceId}`);
      }
      // 2. 그 외의 아직 읽지 않은 일반 알림인 경우
      else if (!notification.isRead) {
        await api.patch(`/api/notifications/${notification.id}/read`);
      }

      // 3. API 호출 성공 후, 최신 알림 목록을 다시 불러와 UI를 갱신
      await fetchNotifications();

      // 4. 알림 타입에 따라 적절한 페이지로 이동
      if (notification.type === NotificationType.NEW_DM && notification.referenceId) {
        navigate(`/dm/room/${notification.referenceId}`);
      } else if (
          (notification.type === NotificationType.STUDY_INVITE ||
              notification.type === NotificationType.JOIN_APPROVED ||
              notification.type === NotificationType.STUDY_JOIN_REQUEST) &&
          notification.referenceId
      ) {
        navigate(`/studies/${notification.referenceId}`);
      } else if (notification.type === NotificationType.CHAT_INVITE && notification.referenceId) {
        navigate(`/chat/room/${notification.referenceId}`);
      }

    } catch (error) {
      console.error('알림 클릭 처리 실패:', error);
      setPageError('알림 처리 중 오류가 발생했습니다.');
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

    if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
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
                                secondary={
                                  <>
                                    <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                                      {notification.isGrouped
                                          ? `가장 최근 발신자: ${notification.senderName}`
                                          : `${notification.senderName} • ${new Date(notification.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}`
                                      }
                                    </Typography>
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