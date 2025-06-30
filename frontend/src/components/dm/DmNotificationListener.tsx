// src/components/dm/DmNotificationListener.tsx (새 파일)
import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import {closeSnackbar, SnackbarKey, useSnackbar} from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';
import { DmMessageResponse } from '../../types/dm';
import { IMessage, StompSubscription } from '@stomp/stompjs';
import {Button} from "@mui/material";

const DmNotificationListener: React.FC = () => {
    const { isLoggedIn, currentUserId } = useAuth();
    const { stompClient, isConnected } = useChat();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    const location = useLocation();
    const dmSubscription = useRef<StompSubscription | null>(null);

    useEffect(() => {
        if (isConnected && stompClient && currentUserId && !dmSubscription.current) {
            const destination = `/sub/dm/user/${currentUserId}`;
            console.log(`[DM Listener] Subscribing to: ${destination}`);

            const sub = stompClient.subscribe(destination, (message: IMessage) => {
                try {
                    const dm: DmMessageResponse = JSON.parse(message.body);

                    // 1. 커스텀 이벤트를 생성합니다.
                    //    이벤트 이름: 'new-dm-message'
                    //    상세 정보(detail): 수신한 메시지 객체
                    const customEvent = new CustomEvent('new-dm-message', { detail: dm });

                    // 2. window 객체를 통해 이벤트를 앱 전체에 알립니다.
                    window.dispatchEvent(customEvent);

                    const dmRoomPath = `/dm/room/${dm.roomId}`;
                    // 현재 보고 있는 DM 채팅방이 아닐 경우에만 알림을 띄웁니다.
                    if (location.pathname !== dmRoomPath) {

                        // --- 이 부분이 최종 수정된 부분입니다 ---
                        const action = (key: SnackbarKey) => (
                            <Button
                                size="small"
                                sx={{ color: 'white', fontWeight: 'bold' }}
                                onClick={() => {
                                    navigate(dmRoomPath); // 해당 채팅방으로 이동
                                    closeSnackbar(key);   // 스낵바 닫기
                                }}
                            >
                                바로가기
                            </Button>
                        );

                        enqueueSnackbar(`'${dm.sender.name}'님으로부터 새 메시지`, {
                            variant: 'success', // DM은 success나 info가 어울립니다.
                            anchorOrigin: { vertical: 'top', horizontal: 'right' },
                            action: action, // onClick 대신 action prop 사용
                        });
                        // ------------------------------------------
                    }

                } catch (e) {
                    console.error("Error processing DM from STOMP:", e);
                }
            });
            dmSubscription.current = sub;
        }

        // 로그인 상태가 아닐 때, 구독이 남아있다면 해제
        if (!isLoggedIn && dmSubscription.current) {
            dmSubscription.current.unsubscribe();
            dmSubscription.current = null;
            console.log('[DM Listener] Unsubscribed due to logout.');
        }

    }, [isConnected, stompClient, currentUserId, isLoggedIn, navigate, enqueueSnackbar, location.pathname]);

    return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
};

export default DmNotificationListener;