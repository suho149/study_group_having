import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Client, IMessage, ActivationState } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext'; // AuthContext에서 토큰 가져오기 위함
import {ChatMessageResponse, ChatMessageSendRequest} from '../types/chat';
import {MessageType} from "../types/apiSpecificEnums"; // ChatMessageResponse 타입 정의 필요

interface ChatContextType {
    stompClient: Client | null;
    isConnected: boolean;
    subscribeToRoom: (roomId: number, onMessageReceived: (message: ChatMessageResponse) => void) => string | undefined;
    unsubscribeFromRoom: (subscriptionId: string) => void;
    sendMessage: (roomId: number, content: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isLoggedIn, token } = useAuth(); // AuthContext에서 토큰과 로그인 상태 가져옴
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [subscriptions, setSubscriptions] = useState<Record<string, any>>({}); // 구독 ID 관리

    useEffect(() => {
        if (isLoggedIn && token && !stompClient) {
            console.log('Attempting to connect WebSocket with token:', token);
            const client = new Client({
                // brokerURL: 'ws://localhost:8080/ws-stomp', // 직접 WebSocket 사용 시
                webSocketFactory: () => new SockJS('http://localhost:8080/ws-stomp'), // SockJS 사용 시
                connectHeaders: {
                    Authorization: `Bearer ${token}`, // 인증 토큰 헤더에 추가
                    // login: 'user', // Spring Security STOMP 기본 인증 사용 시 (여기서는 JWT 사용)
                    // passcode: 'password',
                },
                debug: (str) => {
                    console.log('STOMP Debug:', str);
                },
                reconnectDelay: 5000, // 자동 재연결 딜레이
                onConnect: (frame) => {
                    setIsConnected(true);
                    console.log('STOMP Connected:', frame);
                    // 연결 성공 후 필요한 초기 작업 (예: 특정 방 구독)
                },
                onDisconnect: (frame) => {
                    setIsConnected(false);
                    console.log('STOMP Disconnected:', frame);
                },
                onStompError: (frame) => {
                    setIsConnected(false);
                    console.error('STOMP Error:', frame.headers['message']);
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                    // 에러 처리 (예: 사용자에게 알림)
                },
                onWebSocketError: (event) => {
                    console.error("WebSocket Error", event);
                }
            });

            client.activate(); // 클라이언트 활성화 (연결 시작)
            setStompClient(client);

            return () => {
                if (client && client.active) {
                    console.log('Deactivating STOMP client');
                    client.deactivate();
                    setStompClient(null);
                    setIsConnected(false);
                }
            };
        } else if (!isLoggedIn && stompClient && stompClient.active) {
            console.log('User logged out, deactivating STOMP client');
            stompClient.deactivate();
            setStompClient(null);
            setIsConnected(false);
        }
    }, [isLoggedIn, token, stompClient]);


    const subscribeToRoom = useCallback((roomId: number, onMessageReceived: (message: ChatMessageResponse) => void) => {
        if (stompClient && stompClient.active) { // active로 연결 상태 확인
            const subscriptionDestination = `/sub/chat/room/${roomId}`;
            console.log(`Subscribing to ${subscriptionDestination}`);
            const sub = stompClient.subscribe(subscriptionDestination, (message: IMessage) => {
                try {
                    const parsedMessage: ChatMessageResponse = JSON.parse(message.body);
                    onMessageReceived(parsedMessage);
                } catch (e) {
                    console.error("Failed to parse message body", e, message.body);
                }
            });
            // 구독 ID 저장 (나중에 구독 해제 시 사용)
            const subscriptionId = sub.id; // stompjs는 id를 직접 제공하거나, 헤더에서 가져와야 할 수 있음.
            // 또는 subscribe() 반환 객체에 unsubscribe 함수가 있을 수 있음.
            // 최신 @stomp/stompjs에서는 sub.id로 접근 가능할 수 있음.
            // 여기서는 sub 객체 자체를 저장하고, 나중에 sub.unsubscribe() 호출
            setSubscriptions(prev => ({ ...prev, [roomId.toString()]: sub }));
            return subscriptionId; // 또는 roomId.toString()을 ID로 사용
        }
        console.warn('STOMP client not connected or active, cannot subscribe.');
        return undefined;
    }, [stompClient]);

    const unsubscribeFromRoom = useCallback((subscriptionKey: string) => { // roomId를 key로 사용
        if (stompClient && stompClient.active && subscriptions[subscriptionKey]) {
            console.log(`Unsubscribing from room key: ${subscriptionKey}`);
            subscriptions[subscriptionKey].unsubscribe();
            setSubscriptions(prev => {
                const newSubs = {...prev};
                delete newSubs[subscriptionKey];
                return newSubs;
            });
        }
    }, [stompClient, subscriptions]);

    const sendMessage = useCallback((roomId: number, content: string, type: MessageType = MessageType.TALK) => { // type 인자 추가, 기본값 TALK
        if (stompClient && stompClient.active) {
            const destination = `/pub/chat/room/${roomId}/message`;
            const messagePayload: ChatMessageSendRequest = {
                content,
                messageType: type, // Enum 값 사용
            };
            try {
                stompClient.publish({
                    destination: destination,
                    body: JSON.stringify(messagePayload),
                });
                console.log(`Message sent to ${destination}:`, messagePayload);
            } catch (e) {
                console.error("Failed to send message", e);
            }
        } else {
            console.warn('STOMP client not connected or active, cannot send message.');
        }
    }, [stompClient]);


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