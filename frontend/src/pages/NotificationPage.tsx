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
  Alert, // Alert 추가
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Notification, NotificationTypeStrings } from '../types/notification'; // 공통 타입 사용

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null); // 페이지 레벨 에러
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setPageError(null); // 조회 시작 시 이전 에러 초기화
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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

  const handleGeneralNotificationClick = async (notification: Notification) => {
    // 이미 처리된 초대 알림은 버튼으로 액션이 일어나므로, 여기서는 일반 클릭 시 네비게이션만 처리
    if (notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE')) {
      // 이미 응답한 초대는 클릭해도 특별한 동작 없음 (또는 해당 채팅방/스터디로 이동)
      if (notification.referenceId) {
        if (notification.type === 'CHAT_INVITE') navigate(`/chat/room/${notification.referenceId}`);
        else if (notification.type === 'STUDY_INVITE') navigate(`/studies/${notification.referenceId}`);
      }
      return;
    }

    // 액션 버튼이 있는 (아직 처리 안 된) 초대 알림은 ListItem 전체 클릭보다는 버튼 클릭 유도
    if (!notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE')) {
      return; // 버튼으로 액션하도록 하고, ListItem 전체 클릭은 무시
    }

    try {
      if (!notification.isRead) {
        await api.patch(`/api/notifications/${notification.id}/read`);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
        // unreadCount 상태가 있다면 여기서도 업데이트
      }

      if (notification.type === 'JOIN_APPROVED' || notification.type === 'INVITE_ACCEPTED') {
        if (String(notification.message).toLowerCase().includes("스터디") && notification.referenceId) {
          navigate(`/studies/${notification.referenceId}`);
        } else if (String(notification.message).toLowerCase().includes("채팅방") && notification.referenceId) {
          navigate(`/chat/room/${notification.referenceId}`);
        }
      } else if (notification.type === 'STUDY_JOIN_REQUEST' && notification.referenceId) {
        navigate(`/studies/${notification.referenceId}`);
      }
      // 다른 타입에 대한 네비게이션 로직 추가
    } catch (error) {
      console.error('일반 알림 클릭 처리 실패:', error);
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

  const getStatusChip = (notification: Notification) => {
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
                  const isActionableInvite = !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE');
                  // listItemCanBeClicked: 액션 버튼이 없을 때만 ListItem 전체가 클릭 가능하도록
                  const listItemCanBeClicked = !isActionableInvite;

                  // ListItem에 전달할 props 객체
                  const listItemProps: any = { // ListItemOwnProps 등 더 정확한 타입 사용 가능
                    onClick: listItemCanBeClicked ? () => handleGeneralNotificationClick(notification) : undefined,
                    alignItems: "flex-start", // 추가: alignItems 기본값 설정
                    sx: {
                      py: 1.5, px:2,
                      backgroundColor: !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') ? 'action.hover' : 'inherit',
                      cursor: listItemCanBeClicked ? 'pointer' : 'default',
                      '&:hover': { // 호버 스타일은 sx 내에서 직접 관리
                        backgroundColor: !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE')
                            ? 'action.selected'
                            : (listItemCanBeClicked ? 'action.hover' : 'inherit'),
                      }
                    },
                  };

                  // listItemCanBeClicked가 true일 때만 button prop을 true로 설정
                  if (listItemCanBeClicked) {
                    listItemProps.button = true;
                  }

                  return (
                      <React.Fragment key={notification.id}>
                        <ListItem {...listItemProps}> {/* 수정된 listItemProps 사용 */}
                          <Box sx={{ width: '100%' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body1" sx={{fontWeight: !notification.isRead ? 500 : 'normal', flexGrow:1, mr:1}}>
                                {notification.message}
                              </Typography>
                              {getStatusChip(notification)}
                            </Box>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {notification.senderName && `${notification.senderName} • `}
                              {new Date(notification.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                            </Typography>
                            {getNotificationActions(notification)}
                          </Box>
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