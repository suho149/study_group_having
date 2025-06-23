package com.studygroup.global.interceptor;

import com.studygroup.domain.presence.service.PresenceService;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompDisconnectEventListener implements ApplicationListener<SessionDisconnectEvent> {

    private final PresenceService presenceService;

    @Override
    public void onApplicationEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        UsernamePasswordAuthenticationToken token = (UsernamePasswordAuthenticationToken) headerAccessor.getUser();

        if (Objects.nonNull(token)) {
            UserPrincipal principal = (UserPrincipal) token.getPrincipal();
            String userId = principal.getId().toString();

            // 사용자가 보고 있던 모든 채널에서 퇴장 처리
            presenceService.disconnectUser(userId);
        }
    }
}
