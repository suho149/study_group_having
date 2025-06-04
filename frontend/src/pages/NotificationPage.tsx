import React, { useState, useEffect } from 'react';
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

// NotificationType에 CHAT_INVITE 추가
type NotificationTypeStrings = 'STUDY_INVITE' | 'INVITE_ACCEPTED' | 'INVITE_REJECTED' |
    'CHAT_INVITE' | 'JOIN_APPROVED' | 'JOIN_REJECTED' | 'MEMBER_LEFT_STUDY' |
    'MEMBER_REMOVED_BY_LEADER' | 'LEADER_REMOVED_MEMBER' | 'STUDY_JOIN_REQUEST';

interface Notification {
  id: number;
  message: string;
  type: NotificationTypeStrings; // 모든 가능한 알림 타입 포함
  senderName: string; // 백엔드 NotificationResponse에 이 필드가 있어야 함
  referenceId: number | null; // 스터디 ID 또는 채팅방 ID
  isRead: boolean;
  createdAt: string; // ISO 문자열
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true); // 초기 로딩 상태
  const [processingNotificationId, setProcessingNotificationId] = useState<number | null>(null); // 처리 중인 알림 ID
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      // 최신 알림이 위로 오도록 정렬 (선택 사항, 백엔드에서 정렬하는 것이 더 좋음)
      setNotifications(response.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('알림 조회 실패:', error);
      // TODO: 사용자에게 에러 메시지 표시
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationAction = async (notification: Notification, accept: boolean) => {

    // 이미 처리 중이거나, 해당 알림 타입이 더 이상 액션을 필요로 하지 않는 경우 (예: 이미 수락/거절됨) return
    if (processingNotificationId === notification.id ||
        (notification.type !== 'STUDY_INVITE' && notification.type !== 'CHAT_INVITE') || // 이미 응답한 타입
        notification.isRead // 또는 isRead가 true면 이미 처리된 것으로 간주 (정책에 따라)
    ) {
      console.log("Notification action already processed, in progress, or not actionable:", notification);
      return;
    }

    if (notification.referenceId === null || notification.referenceId === undefined) {
      console.error('Notification referenceId is missing or invalid:', notification);
      alert('관련 정보를 찾을 수 없어 알림을 처리할 수 없습니다.');
      return;
    }

    setProcessingNotificationId(notification.id);

    try {
      if (notification.type === 'STUDY_INVITE') {
        await api.post(`/api/studies/${notification.referenceId}/invite/response`, { accept });
      } else if (notification.type === 'CHAT_INVITE') {
        await api.post(`/api/chat/rooms/${notification.referenceId}/invites/respond?accept=${accept}`);
      }

      // API 호출 성공 후 알림 목록을 새로고침하는 것이 가장 확실함
      // 또는 로컬에서 해당 알림만 상태 변경 (isRead: true, type 변경 등)
      // 여기서는 목록 새로고침으로 변경하여 최신 상태를 반영
      await fetchNotifications(); // <--- API 성공 후 목록 새로고침

      if (accept) {
        if (notification.type === 'CHAT_INVITE') {
          navigate(`/chat/room/${notification.referenceId}`);
        } else if (notification.type === 'STUDY_INVITE') {
          navigate(`/studies/${notification.referenceId}`); // 스터디 상세 페이지로 이동 (예시)
        }
      }
      // 성공 메시지 (선택 사항)
      // alert(`초대를 ${accept ? '수락' : '거절'}했습니다.`);

    } catch (error: any) { // AxiosError 등으로 타입 구체화 가능
      console.error('알림 처리 실패:', error);
      alert(`알림 처리 중 오류가 발생했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessingNotificationId(null);
    }
  };

  const getNotificationActions = (notification: Notification) => {
    // STUDT_INVITE 또는 CHAT_INVITE 타입이고, 아직 처리 중이 아닐 때만 버튼 표시
    // isRead 조건은 fetchNotifications() 후 서버 상태를 따르도록 함
    // (만약 백엔드에서 초대 응답 시 isRead를 true로 바꾼다면, isRead 조건만으로도 충분)
    if ((notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') && !notification.isRead) {
      return (
          <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
            <Button
                variant="contained"
                color="primary"
                size="small"
                onClick={() => handleNotificationAction(notification, true)}
                disabled={processingNotificationId === notification.id} // 처리 중 비활성화
            >
              {processingNotificationId === notification.id && <CircularProgress size={16} color="inherit" sx={{mr:0.5}} />}
              수락
            </Button>
            <Button
                variant="outlined"
                color="secondary"
                size="small"
                onClick={() => handleNotificationAction(notification, false)}
                disabled={processingNotificationId === notification.id} // 처리 중 비활성화
            >
              {processingNotificationId === notification.id && <CircularProgress size={16} color="inherit" sx={{mr:0.5}} />}
              거절
            </Button>
          </Box>
      );
    }
    return null;
  };

  const getStatusChip = (notification: Notification) => {
    // 서버에서 받은 type과 isRead를 기준으로 Chip 표시
    if (notification.type === 'INVITE_ACCEPTED' || (notification.type === 'STUDY_INVITE' && notification.isRead /* 백엔드에서 수락시 isRead 변경 가정 */)) {
      return <Chip label="수락됨" size="small" color="success" />;
    }
    if (notification.type === 'INVITE_REJECTED' || (notification.type === 'STUDY_INVITE' && notification.isRead /* 백엔드에서 거절시 isRead 변경 가정 */)) {
      return <Chip label="거절됨" size="small" color="error" />;
    }
    if (notification.type === 'CHAT_INVITE') {
      return notification.isRead ?
          <Chip label="초대 확인됨" size="small" color="default" /> : // 또는 "처리됨"
          <Chip label="새 채팅 초대" size="small" color="info" />;
    }
    // ... 다른 알림 타입에 대한 Chip ...
    return notification.isRead ?
        <Chip label="읽음" size="small" color="default" /> :
        <Chip label="새 알림" size="small" color="primary" />;
  };

  // if (loading && notifications.length === 0) {
  if (loading) { // 초기 로딩
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        {/* ... (페이지 타이틀) ... */}
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
                            py: 1.5, // 패딩 조정
                            backgroundColor: !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') ? 'action.hover' : 'inherit',
                            '&:hover': {
                              backgroundColor: !notification.isRead && (notification.type === 'STUDY_INVITE' || notification.type === 'CHAT_INVITE') ? 'action.selected' : 'action.hover',
                            }
                          }}
                          // 알림 클릭 시 상세 페이지로 이동하거나 읽음 처리 (선택 사항)
                          // button={!notification.isRead}
                          // onClick={!notification.isRead ? () => markAsReadAndNavigate(notification) : undefined}
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