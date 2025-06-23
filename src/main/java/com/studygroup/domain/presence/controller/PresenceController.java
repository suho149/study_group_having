package com.studygroup.domain.presence.controller;

import com.studygroup.domain.presence.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    // 클라이언트가 /pub/presence/enter/{type}/{id} 로 입장 메시지를 보냄
    @MessageMapping("/presence/enter/{type}/{id}")
    public void handleEnter(
            @DestinationVariable String type,
            @DestinationVariable String id,
            Principal principal) {
        String channel = type + "/" + id;
        String userId = principal.getName(); // UserPrincipal의 getName()은 사용자 ID를 반환
        presenceService.userEntered(channel, userId);
    }

    // 클라이언트가 /pub/presence/exit/{type}/{id} 로 퇴장 메시지를 보냄
    @MessageMapping("/presence/exit/{type}/{id}")
    public void handleExit(
            @DestinationVariable String type,
            @DestinationVariable String id,
            Principal principal) {
        String channel = type + "/" + id;
        String userId = principal.getName();
        presenceService.userExited(channel, userId);
    }
}
