import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {useSnackbar, closeSnackbar, SnackbarKey} from 'notistack';
import {useLocation, useNavigate} from 'react-router-dom';
import { Notification, NotificationType } from '../../types/notification';
import { Button } from '@mui/material';

// --- 알림 그룹화를 위한 상태를 컴포넌트 외부에서 관리 (useRef 사용) ---
// key: 그룹화 기준 (예: 'dm-room-1'), value: { count: number, lastMessage: string }
const notificationGroup = new Map<string, { count: number; message: string; data: Notification }>();

// 이 컴포넌트는 아무것도 렌더링하지 않습니다.
const NotificationListener: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();

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

                    let groupKey: string | null = null;
                    // NEW_DM 타입일 때만 그룹화 (그룹화 기준: 채팅방 ID)
                    if (notificationData.type === NotificationType.NEW_DM) {
                        groupKey = `dm-room-${notificationData.referenceId}`;
                    }

                    // 1. 그룹화 대상인 경우
                    if (groupKey) {
                        // 현재 보고 있는 채팅방이면 아무것도 하지 않음
                        if (location.pathname === `/dm/room/${notificationData.referenceId}`) {
                            return;
                        }

                        const existingGroup = notificationGroup.get(groupKey);

                        // 이미 해당 그룹의 알림이 떠 있는 경우
                        if (existingGroup) {
                            existingGroup.count += 1;
                            existingGroup.message = `'${notificationData.senderName}'님 외 ${existingGroup.count - 1}명으로부터 새 메시지`;
                            existingGroup.data = notificationData; // 최신 알림 정보로 업데이트
                        } else {
                            // 처음 온 그룹 알림인 경우
                            notificationGroup.set(groupKey, {
                                count: 1,
                                message: notificationData.message,
                                data: notificationData,
                            });
                        }

                        const groupInfo = notificationGroup.get(groupKey)!;
                        const finalMessage = groupInfo.count > 1 ? groupInfo.message : notificationData.message;

                        // notistack의 key를 그룹 key로 사용하여, 기존 스낵바를 업데이트/교체
                        enqueueSnackbar(finalMessage, {
                            key: groupKey,
                            variant: 'success',
                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                            action: (key: SnackbarKey) => (
                                <Button size="small" sx={{ color: 'white' }} onClick={() => {
                                    navigate(`/dm/room/${groupInfo.data.referenceId}`);
                                    notificationGroup.delete(groupKey!);
                                    closeSnackbar(key);
                                }}>
                                    {groupInfo.count > 1 ? `+${groupInfo.count} 확인` : '보러가기'}
                                </Button>
                            ),
                            onExited: (event, key) => {
                                // 스낵바가 자동으로 닫히면 맵에서 제거
                                notificationGroup.delete(key as string);
                            }
                        });

                    } else {
                        // 2. 그룹화 대상이 아닌 일반 알림 (기존 로직)
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
                    }

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