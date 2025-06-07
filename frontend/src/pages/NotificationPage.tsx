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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Notification, NotificationTypeStrings } from '../types/notification'; // 공통 타입 사용

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null); // 처리 중인 알림 ID
  const [processedNotifications, setProcessedNotifications] = useState<Set<number>>(new Set()); // 처리된 알림 ID들
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('알림 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationAction = async (notification: Notification, accept: boolean) => {
    // 이미 처리된 알림이거나 현재 처리 중인 알림이면 리턴
    if (processedNotifications.has(notification.id) || processingNotificationId === notification.id) {
      return;
    }

    if (notification.referenceId === null || notification.referenceId === undefined) {
      alert('관련 정보를 찾을 수 없어 알림을 처리할 수 없습니다.');
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
        console.warn("Unhandled actionable notification type for action:", notification.type);
        setProcessingNotificationId(null);
        return;
      }

      if (apiCalled) {
        // 처리된 알림 ID를 Set에 추가
        setProcessedNotifications(prev => {
          const newSet = new Set(prev); // 기존 Set을 복사
          newSet.add(notification.id);  // 새 값을 추가
          return newSet;                // 새로운 Set 반환
        });

        // API 성공 후 로컬 상태 즉시 업데이트
        setNotifications(prevNotifications =>
            prevNotifications.map(n =>
                n.id === notification.id
                    ? { ...n, isRead: true } // isRead를 true로 설정
                    : n
            )
        );

        // 페이지 이동 처리
        if (accept) {
          if (notification.type === 'CHAT_INVITE') navigate(`/chat/room/${notification.referenceId}`);
          else if (notification.type === 'STUDY_INVITE') navigate(`/studies/${notification.referenceId}`);
        }
      }
    } catch (error: any) {
      console.error('알림 처리 실패:', error);
      alert(`알림 처리 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);

      // 에러 발생 시에도 처리된 것으로 마킹하여 중복 요청 방지
      setProcessedNotifications(prev => {
        const newSet = new Set(prev); // 기존 Set을 복사
        newSet.add(notification.id);  // 새 값을 추가
        return newSet;                // 새로운 Set 반환
      });
      setNotifications(prevNotifications =>
          prevNotifications.map(n =>
              n.id === notification.id
                  ? { ...n, isRead: true } // 에러가 발생해도 isRead를 true로 설정
                  : n
          )
      );
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const getNotificationActions = (notification: Notification) => {
    // isRead가 true이거나 이미 처리된 알림이면 버튼 숨김
    if (notification.isRead || processedNotifications.has(notification.id)) {
      return null;
    }

    // 현재 처리 중인 알림이면 버튼 비활성화 상태로 표시
    const isProcessing = processingNotificationId === notification.id;

    if (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') {
      return (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => handleNotificationAction(notification, true)}
                disabled={isProcessing}
                sx={{minWidth: 60}}
            >
              {isProcessing ? <CircularProgress size={16} color="inherit" /> : '수락'}
            </Button>
            <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => handleNotificationAction(notification, false)}
                disabled={isProcessing}
                sx={{minWidth: 60}}
            >
              {isProcessing ? <CircularProgress size={16} color="inherit" /> : '거절'}
            </Button>
          </Box>
      );
    }
    return null;
  };

  const getStatusChip = (notification: Notification) => {
    // 처리된 알림이거나 isRead가 true이고, 원래 초대 타입이었던 알림
    if ((notification.isRead || processedNotifications.has(notification.id)) && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE')) {
      return <Chip label="응답완료" size="small" color="default" variant="outlined" />;
    }

    // 아직 읽지 않은(처리하지 않은) 알림 또는 다른 타입의 알림
    switch (notification.type) {
      case 'STUDY_INVITE': // isRead가 false이고 처리되지 않았을 때만 이리로 옴
        return <Chip label="새 스터디 초대" size="small" color="info" />;
      case 'CHAT_INVITE': // isRead가 false이고 처리되지 않았을 때만 이리로 옴
        return <Chip label="새 채팅 초대" size="small" color="info" />;
      case 'INVITE_ACCEPTED':
      case 'JOIN_APPROVED':
        return <Chip label={notification.isRead ? "확인됨" : "수락됨"} size="small" color="success" />;
      case 'INVITE_REJECTED':
      case 'JOIN_REJECTED':
        return <Chip label={notification.isRead ? "확인됨" : "거절됨"} size="small" color="error" />;
      default:
        return notification.isRead ?
            <Chip label="읽음" size="small" color="default" variant="outlined" /> :
            <Chip label="새 알림" size="small" color="primary" />;
    }
  };

  if (loading) { // 초기 로딩
    return (
        <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Container>
    );
  }

  return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>알림</Typography>
        <Paper elevation={1} sx={{borderRadius: 2}}>
          <List sx={{p:0}}>
            {notifications.length === 0 ? (
                <ListItem>
                  <ListItemText primaryTypographyProps={{textAlign:'center', color:'text.secondary'}} primary="새로운 알림이 없습니다." />
                </ListItem>
            ) : (
                notifications.map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <ListItem
                          alignItems="flex-start"
                          sx={{
                            py: 1.5, px:2,
                            // 읽지 않은 초대 알림만 배경색 강조
                            backgroundColor: !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') ? 'action.hover' : 'inherit',
                          }}
                      >
                        <Box sx={{ width: '100%' }}>
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" sx={{fontWeight: !notification.isRead ? 500 : 'normal'}}>
                              {notification.message}
                            </Typography>
                            {getStatusChip(notification)}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {notification.senderName ? `${notification.senderName} • ` : ''}
                            {new Date(notification.createdAt).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' })}
                          </Typography>
                          {getNotificationActions(notification)}
                        </Box>
                      </ListItem>
                      {index < notifications.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                ))
            )}
          </List>
        </Paper>
      </Container>
  );
};

export default NotificationPage;