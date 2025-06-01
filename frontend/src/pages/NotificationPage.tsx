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

interface Notification {
  id: number;
  message: string;
  type: 'STUDY_INVITE' | 'INVITE_ACCEPTED' | 'INVITE_REJECTED';
  senderName: string;
  referenceId: number;
  isRead: boolean;
  createdAt: string;
}

const NotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  };

  const handleNotificationAction = async (notification: Notification, accept: boolean) => {
    try {
      // 즉시 상태 업데이트
      setNotifications(prev => prev.map(n => {
        if (n.id === notification.id) {
          return {
            ...n,
            isRead: true,
            type: accept ? 'INVITE_ACCEPTED' : 'INVITE_REJECTED',
            message: accept ? 
              `${n.message.split('에서')[0]}에 참여했습니다.` :
              `${n.message.split('에서')[0]} 초대를 거절했습니다.`
          };
        }
        return n;
      }));

      // 백엔드 API 호출
      if (notification.type === 'STUDY_INVITE') {
        await api.post(
          `/api/studies/${notification.referenceId}/invite/response`,
          { accept }
        );

        // 알림을 읽음으로 표시
        await api.patch(`/api/notifications/${notification.id}/read`);
      }
    } catch (error) {
      console.error('알림 처리 실패:', error);
      // 에러 발생 시 원래 상태로 복구
      fetchNotifications();
    }
  };

  const getNotificationActions = (notification: Notification) => {
    if (notification.type === 'STUDY_INVITE' && !notification.isRead) {
      return (
        <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleNotificationAction(notification, true)}
          >
            수락
          </Button>
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleNotificationAction(notification, false)}
          >
            거절
          </Button>
        </Box>
      );
    }
    return null;
  };

  const getStatusChip = (notification: Notification) => {
    switch (notification.type) {
      case 'INVITE_ACCEPTED':
        return <Chip label="수락됨" size="small" color="success" />;
      case 'INVITE_REJECTED':
        return <Chip label="거절됨" size="small" color="error" />;
      default:
        return notification.isRead ? 
          <Chip label="읽음" size="small" color="default" /> :
          <Chip label="새 알림" size="small" color="primary" />;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        알림
      </Typography>
      <Paper>
        <List>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="새로운 알림이 없습니다." />
            </ListItem>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1">{notification.message}</Typography>
                      {getStatusChip(notification)}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {notification.senderName} • {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                    {getNotificationActions(notification)}
                  </Box>
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))
          )}
        </List>
      </Paper>
    </Container>
  );
};

export default NotificationPage; 