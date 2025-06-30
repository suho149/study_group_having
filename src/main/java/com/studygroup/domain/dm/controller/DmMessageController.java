package com.studygroup.domain.dm.controller;

import com.studygroup.domain.dm.dto.DmDto;
import com.studygroup.domain.dm.service.DmService;
import com.studygroup.global.security.CurrentUser;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Objects;

@Slf4j
@Controller
@RequiredArgsConstructor
public class DmMessageController {

    private final DmService dmService;

    @MessageMapping("/dm/send")
    public void sendMessage(
            @Payload DmDto.SendRequest request,
            Principal principal) {

        // 1. null 체크: STOMP 세션에 인증 정보가 있는지 확인
        if (principal == null) {
            log.error("Cannot process DM: Principal is null. Connection might not be authenticated.");
            // 여기서 예외를 던지거나, 조용히 무시할 수 있습니다.
            return;
        }

        // 2. Principal을 Authentication 객체로 캐스팅
        Authentication authentication = (Authentication) principal;

        // 3. Authentication 객체에서 우리가 직접 만든 UserPrincipal을 꺼냅니다.
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        Long roomId = request.getRoomId();
        Long senderId = userPrincipal.getId();
        String content = request.getContent();

        log.info("DM Message Received: roomId={}, senderId={}, content='{}'",
                roomId, senderId, content);

        dmService.sendMessage(roomId, senderId, content);
    }
}
