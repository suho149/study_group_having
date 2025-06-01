import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Notification {
  id: number;
  message: string;
  type: 'STUDY_INVITE' | 'INVITE_ACCEPTED' | 'INVITE_REJECTED';
  senderName: string;
  referenceId: number;
  isRead: boolean;
  createdAt: string;
}

const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const response = await api.get<Notification[]>('/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('알림 조회 실패:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<number>('/api/notifications/unread-count');
      setUnreadCount(response.data);
    } catch (error) {
      console.error('읽지 않은 알림 수 조회 실패:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, []);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
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
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360,
          },
        }}
      >
        <Box p={2}>
          <Typography variant="h6">알림</Typography>
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography color="textSecondary">
              새로운 알림이 없습니다.
            </Typography>
          </MenuItem>
        ) : (
          <List>
            {notifications.map((notification) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'inherit' : 'action.hover',
                  }}
                >
                  <ListItemText
                    primary={notification.message}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="textSecondary">
                          {notification.senderName} • {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
};

export default NotificationList; 