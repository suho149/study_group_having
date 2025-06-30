package com.studygroup.global.interceptor;

import com.studygroup.global.jwt.TokenProvider;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final TokenProvider tokenProvider; // JWT 토큰 공급자

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        Objects.requireNonNull(accessor); // accessor null 체크

        log.debug("STOMP Command: {}, Headers: {}", accessor.getCommand(), accessor.toNativeHeaderMap());

        StompCommand command = accessor.getCommand();
        log.info("STOMP Command Received: {}", command); // 모든 STOMP 명령어를 로그로 출력

        // CONNECT 요청일 때만 토큰 검증 (또는 SEND, SUBSCRIBE 등 필요에 따라)
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String jwt = extractJwtFromHeader(accessor);
            log.debug("Extracted JWT from STOMP CONNECT: {}", jwt);

            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                UserPrincipal userPrincipal = tokenProvider.getPrincipalFromToken(jwt);
                // STOMP 세션에 사용자 인증 정보 저장
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userPrincipal, null, userPrincipal.getAuthorities());
                accessor.setUser(authentication); // SimpMessageHeaderAccessor에 Principal 설정
                log.info("STOMP User authenticated: {}", userPrincipal.getUsername());
            } else {
                log.warn("STOMP CONNECT: Invalid or missing JWT token. Access Denied.");
                // 인증 실패 시 연결 거부 (예외 발생 또는 특정 에러 메시지 전송)
                // 여기서는 예외를 발생시켜 StompErrorHandler에서 처리하도록 유도 가능
                throw new AccessDeniedException("Invalid or missing JWT token for STOMP connection.");
            }
        }
        // SEND, SUBSCRIBE 요청 시에도 사용자 인증 정보 확인 가능 (accessor.getUser())
        // 예: if (StompCommand.SEND.equals(accessor.getCommand()) && accessor.getUser() == null) { throw ... }
        else if (StompCommand.SEND.equals(command) || StompCommand.SUBSCRIBE.equals(command)) {
            log.debug("Processing {} command...", command);
            if (accessor.getUser() == null) {
                // 이 경우는 이론적으로 발생하면 안됩니다. (CONNECT가 먼저 성공해야 하므로)
                // 하지만 발생했다면, 인증되지 않은 세션에서 메시지를 보내려는 시도입니다.
                log.error("Unauthorized {} attempt: No user in STOMP session.", command);
                throw new AccessDeniedException("Unauthorized STOMP request: Not connected or authenticated.");
            }
            log.info("Authorized {} from user: {}", command, accessor.getUser().getName());
        }

        return message;
    }

    private String extractJwtFromHeader(StompHeaderAccessor accessor) {
        // 프론트엔드에서 STOMP 연결 시 헤더에 'Authorization': 'Bearer <token>' 형태로 전달 가정
        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        // 다른 헤더 이름 (예: 'X-Authorization-Token')을 사용할 수도 있음
        // String authToken = accessor.getFirstNativeHeader("X-Auth-Token");
        // if (StringUtils.hasText(authToken)) {
        //     return authToken;
        // }
        return null;
    }
}
