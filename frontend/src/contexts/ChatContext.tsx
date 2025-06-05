import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Client, IMessage, Frame } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext'; // AuthContext에서 토큰 가져오기 위함
import {ChatMessageResponse, ChatMessageSendRequest} from '../types/chat';
import {MessageType} from "../types/apiSpecificEnums"; // ChatMessageResponse 타입 정의 필요

interface ChatContextType {
    stompClient: Client | null;
    isConnected: boolean;
    subscribeToRoom: (roomId: number, onMessageReceived: (message: ChatMessageResponse) => void) => string | undefined;
    unsubscribeFromRoom: (subscriptionId: string) => void;
    sendMessage: (roomId: number, content: string, messageType?: MessageType) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoggedIn, token } = useAuth(); // AuthContext에서 토큰과 로그인 상태 가져옴
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Record<string, { unsubscribe: () => void }>>({}); // 구독 객체 저장

    useEffect(() => {
        let client: Client | null = null;

        if (isLoggedIn) {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                console.warn('ChatContext: Token not found. STOMP connection aborted.');
                setIsConnected(false); // 명시적으로 연결 안 됨 상태
                if (stompClient?.active) stompClient.deactivate(); // 기존 클라이언트 비활성화
                setStompClient(null);
                return;
            }

            console.log('ChatContext: Initializing STOMP client...');
            client = new Client({
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'),
                connectHeaders: {
                    Authorization: `Bearer ${currentToken}`,
                },
                debug: (str) => { console.log('STOMP_DEBUG: ' + str); },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000, // 서버로부터 하트비트 수신 간격
                heartbeatOutgoing: 4000, // 서버로 하트비트 발신 간격

                onConnect: (frame: Frame) => { // frame 타입 명시
                    setIsConnected(true);
                    setStompClient(client); // <--- 연결 성공 시 client 객체를 상태로 설정
                    console.log('STOMP: Connected to server.', frame);
                },
                onDisconnect: (frame: Frame) => { // frame 타입 명시
                    setIsConnected(false);
                    console.log('STOMP: Disconnected from server.', frame);
                    // setStompClient(null); // 재연결을 시도하므로 여기서 null로 하면 안됨
                },
                onStompError: (frame: Frame) => { // frame 타입 명시
                    setIsConnected(false);
                    console.error('STOMP: Broker reported error: ' + frame.headers['message']);
                    console.error('STOMP: Additional details: ' + frame.body);
                    // 에러 시 client를 null로 설정하여 재시도 방지 또는 다른 로직
                    // client?.deactivate(); // 에러 발생 시 비활성화
                    // setStompClient(null);
                },
                onWebSocketError: (event: Event) => { // Event 타입 명시
                    setIsConnected(false);
                    console.error("STOMP: WebSocket error observed:", event);
                },
                onWebSocketClose: (event: CloseEvent) => { // CloseEvent 타입 명시
                    setIsConnected(false);
                    console.log("STOMP: WebSocket connection closed.", event);
                    // 연결이 의도치 않게 닫힌 경우, setStompClient(null)을 호출하여
                    // 다음 로그인 시 새 클라이언트를 만들도록 할 수 있음.
                    // 또는 client.activate()를 다시 호출하여 재연결 시도 (라이브러리가 이미 할 수 있음)
                    if (!client?.active) { // 이미 비활성화된 상태가 아니라면
                        // setStompClient(null); // 재연결 로직이 있다면 이 부분은 신중해야 함
                    }
                }
            });

            console.log('ChatContext: Activating STOMP client...');
            client.activate();

        } else {
            // 로그인 상태가 아닐 때 기존 클라이언트 비활성화 및 정리
            if (stompClient && stompClient.active) {
                console.log('ChatContext: User not logged in or token changed, deactivating STOMP client.');
                stompClient.deactivate();
            }
            setStompClient(null);
            setIsConnected(false);
            setSubscriptions({}); // 구독 정보도 초기화
        }

        // Cleanup 함수: 컴포넌트 언마운트 시 또는 isLoggedIn 변경으로 재실행되기 전
        return () => {
            console.log('ChatContext: Cleanup effect. Current client:', client, 'Current stompClient state:', stompClient);
            // 현재 useEffect 스코프의 client를 비활성화
            if (client && client.active) {
                console.log('ChatContext: Deactivating client from effect cleanup.');
                client.deactivate();
            }
            // 만약 상태의 stompClient가 현재 스코프의 client와 다르고 활성 상태라면 그것도 비활성화
            // (isLoggedIn 변경으로 인해 새 client가 생성되기 전에 이전 client 정리)
            if (stompClient && stompClient !== client && stompClient.active) {
                console.log('ChatContext: Deactivating stompClient state from effect cleanup.');
                stompClient.deactivate();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]); // 로그인 상태 변경 시에만 재연결 로직 실행


    const subscribeToRoom = useCallback((roomId: number, onMessageReceived: (message: ChatMessageResponse) => void) => {
        // stompClient가 null이 아니고, active 상태이며, isConnected가 true일 때 구독
        if (stompClient && stompClient.active && isConnected) {
            const subscriptionDestination = `/sub/chat/room/${roomId}`;
            console.log(`ChatContext: Subscribing to ${subscriptionDestination}`);
            try {
                const sub = stompClient.subscribe(subscriptionDestination, (message: IMessage) => {
                    try {
                        const parsedMessage: ChatMessageResponse = JSON.parse(message.body);
                        onMessageReceived(parsedMessage);
                    } catch (e) {
                        console.error("ChatContext: Failed to parse message body", e, message.body);
                    }
                });
                // stompjs의 StompSubscription 객체는 id와 unsubscribe 함수를 가짐
                const subId = `room-${roomId}`; // 고유한 ID 생성 (예시)
                setSubscriptions(prev => ({ ...prev, [subId]: sub }));
                return subId;
            } catch (e) {
                console.error(`ChatContext: Failed to subscribe to ${subscriptionDestination}`, e);
                return undefined;
            }
        }
        console.warn('ChatContext: STOMP client not ready for subscription.', {stompClientExists: !!stompClient, isActive: stompClient?.active, isConnected});
        return undefined;
    }, [stompClient, isConnected]); // isConnected도 의존성에 추가

    const unsubscribeFromRoom = useCallback((subscriptionId: string) => {
        if (subscriptions[subscriptionId]) {
            console.log(`ChatContext: Unsubscribing from ${subscriptionId}`);
            try {
                subscriptions[subscriptionId].unsubscribe();
                setSubscriptions(prev => {
                    const newSubs = {...prev};
                    delete newSubs[subscriptionId];
                    return newSubs;
                });
            } catch(e) {
                console.error(`ChatContext: Error unsubscribing from ${subscriptionId}`, e);
            }
        } else {
            console.warn(`ChatContext: No subscription found for ID: ${subscriptionId}`);
        }
    }, [subscriptions]);

    const sendMessage = useCallback((roomId: number, content: string, messageType: MessageType = MessageType.TALK) => {
        // stompClient가 null이 아니고, active 상태이며, isConnected가 true일 때 메시지 전송
        if (stompClient && stompClient.active && isConnected) {
            const destination = `/pub/chat/room/${roomId}/message`;
            const messagePayload: ChatMessageSendRequest = { content, messageType };
            try {
                stompClient.publish({
                    destination: destination,
                    body: JSON.stringify(messagePayload),
                });
                console.log(`ChatContext: Message sent to ${destination}:`, messagePayload);
            } catch (e) {
                console.error("ChatContext: Failed to send message via STOMP", e);
            }
        } else {
            console.warn('ChatContext: STOMP client not ready for sending message.', {stompClientExists: !!stompClient, isActive: stompClient?.active, isConnected});
        }
    }, [stompClient, isConnected]); // isConnected도 의존성에 추가


    return (
        <ChatContext.Provider value={{ stompClient, isConnected, subscribeToRoom, unsubscribeFromRoom, sendMessage }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};