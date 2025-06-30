import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

// PresenceContext가 제공할 함수와 상태의 타입
interface PresenceContextType {
    isConnected: boolean;
    joinChannel: (channel: string) => void;
    leaveChannel: (channel: string) => void;
    subscribeToPresence: (channel: string, callback: (count: number) => void) => StompSubscription | undefined;
    unsubscribe: (subscription: StompSubscription) => void;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // WebSocket 클라이언트 인스턴스는 ChatContext와 동일하게 ref로 관리
    const stompClientRef = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { isLoggedIn } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            const token = localStorage.getItem('token');
            if (!token) return;

            if (stompClientRef.current) return;

            const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://having.duckdns.org';
            // SockJS는 http(s) 프로토콜을 사용해야 하므로, '/ws-stomp' 경로만 붙여줍니다.
            const sockjsUrl = `${baseUrl}/ws-stomp`;

            const client = new Client({
                webSocketFactory: () => new SockJS(sockjsUrl),
                connectHeaders: { Authorization: `Bearer ${token}` },
                reconnectDelay: 10000,
                debug: (str) => { console.log(`PRESENCE_STOMP: ${str}`); }, // 로그 접두사 변경
                onConnect: () => {
                    console.log('[PresenceContext] STOMP connected.');
                    setIsConnected(true);
                },
                onDisconnect: () => {
                    console.log('[PresenceContext] STOMP disconnected.');
                    setIsConnected(false);
                },
            });

            client.activate();
            stompClientRef.current = client;

        } else {
            if (stompClientRef.current?.active) {
                stompClientRef.current.deactivate();
                stompClientRef.current = null;
                setIsConnected(false);
            }
        }
        return () => {
            if (stompClientRef.current?.active) {
                stompClientRef.current.deactivate();
            }
        };
    }, [isLoggedIn]);

    const joinChannel = useCallback((channel: string) => {
        if (stompClientRef.current?.active) {
            stompClientRef.current.publish({ destination: `/pub/presence/enter/${channel}` });
        }
    }, []);

    const leaveChannel = useCallback((channel: string) => {
        if (stompClientRef.current?.active) {
            stompClientRef.current.publish({ destination: `/pub/presence/exit/${channel}` });
        }
    }, []);

    const subscribeToPresence = useCallback((channel: string, callback: (count: number) => void) => {
        if (stompClientRef.current?.active) {
            const destination = `/sub/presence/${channel}`;
            console.log(`[PresenceContext] Subscribing to: ${destination}`);

            return stompClientRef.current.subscribe(destination, (message: IMessage) => {
                callback(Number(message.body));
            });
        }
        return undefined;
    }, []);

    const unsubscribe = useCallback((subscription: StompSubscription) => {
        subscription.unsubscribe();
    }, []);

    const value = { isConnected, joinChannel, leaveChannel, subscribeToPresence, unsubscribe };

    return (
        <PresenceContext.Provider value={value}>
            {children}
        </PresenceContext.Provider>
    );
};

// 커스텀 훅 생성
export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};