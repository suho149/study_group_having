package com.studygroup.global.config;

import com.studygroup.global.handler.StompErrorHandler;
import com.studygroup.global.interceptor.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // STOMP 메시징 활성화
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final StompErrorHandler stompErrorHandler;


    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 클라이언트가 메시지를 발행(publish)할 때 사용할 prefix (메시지 핸들러 라우팅)
        // 예: /pub/chat/message -> @MessageMapping("/chat/message") 핸들러
        registry.setApplicationDestinationPrefixes("/pub");

        // 클라이언트가 메시지를 구독(subscribe)할 때 사용할 prefix (메시지 브로커 라우팅)
        // 예: /sub/chat/room/1 -> 1번 채팅방 구독
        registry.enableSimpleBroker("/sub"); // 내장 Simple Broker 사용
        // 외부 메시지 브로커(RabbitMQ, Kafka 등) 사용 시 enableStompBrokerRelay() 설정
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트가 WebSocket 연결을 생성할 때 사용할 엔드포인트
        registry.addEndpoint("/ws-stomp") // 예: ws://localhost:8080/ws-stomp
                .setAllowedOriginPatterns("http://localhost:3000") // 프론트엔드 출처 허용 (패턴 사용)
                .withSockJS(); // SockJS 사용 (WebSocket 지원 안하는 브라우저 호환)

        registry.setErrorHandler(stompErrorHandler); // STOMP 에러 핸들러 등록
    }

    // STOMP 메시지 처리 전 인증 등을 위한 채널 인터셉터 등록
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }
}
