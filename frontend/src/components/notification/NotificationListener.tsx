// src/components/notification/NotificationListener.tsx (새 파일)

import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {useSnackbar, closeSnackbar, SnackbarKey} from 'notistack';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationType } from '../../types/notification';
import { Button } from '@mui/material';

// 이 컴포넌트는 아무것도 렌더링하지 않습니다.
const NotificationListener: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        let eventSource: EventSource | undefined;

        if (isLoggedIn) {
            // localStorage에서 현재 토큰을 가져옵니다.
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn("SSE: Token not found, connection aborted.");
                return;
            }

            console.log('SSE Listener: User is logged in, connecting with token...');

            // --- 이 부분이 핵심 수정 사항입니다 ---
            // URL에 쿼리 파라미터로 토큰을 추가합니다.
            eventSource = new EventSource(`http://localhost:8080/api/notifications/subscribe?token=${token}`);

            eventSource.onopen = () => console.log('SSE: Connection opened.');

            eventSource.addEventListener('new-notification', (event) => {
                try {
                    const notificationData: Notification = JSON.parse(event.data);

                    const handleNavigation = () => {
                        if (notificationData.referenceId) {
                            switch (notificationData.type) {
                                case NotificationType.STUDY_INVITE:
                                case NotificationType.JOIN_APPROVED:
                                    navigate(`/studies/${notificationData.referenceId}`);
                                    break;
                                case NotificationType.CHAT_INVITE:
                                    navigate(`/chat/room/${notificationData.referenceId}`);
                                    break;
                                case NotificationType.NEW_DM:
                                    navigate(`/dm/room/${notificationData.referenceId}`);
                                    break;
                                default:
                                    navigate('/notifications');
                                    break;
                            }
                        } else {
                            navigate('/notifications');
                        }
                    };

                    // --- 이 부분이 최종 수정된 부분입니다 ---
                    const action = (key: SnackbarKey) => (
                        <Button
                            size="small"
                            sx={{ color: 'white' }}
                            onClick={() => {
                                handleNavigation();
                                closeSnackbar(key);
                            }}
                        >
                            보러가기
                        </Button>
                    );

                    enqueueSnackbar(notificationData.message, {
                        variant: 'info',
                        anchorOrigin: { vertical: 'top', horizontal: 'right' },
                        // onClick 대신 action prop을 사용하여 버튼을 렌더링합니다.
                        action: action,
                    });
                    // ------------------------------------------

                } catch (error) {
                    console.error("Error parsing SSE notification data:", error);
                }
            });

            eventSource.onerror = (error) => {
                console.error('SSE: Error occurred', error);
                eventSource?.close();
            };
        }

        return () => {
            if (eventSource) {
                eventSource.close();
                console.log('SSE: Connection closed.');
            }
        };
    }, [isLoggedIn, enqueueSnackbar, navigate]);

    return null; // 아무것도 렌더링하지 않음
};

export default NotificationListener;