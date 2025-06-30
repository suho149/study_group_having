package com.studygroup.domain.chat.controller;

import com.studygroup.domain.chat.dto.ChatMessageSendRequest;
import com.studygroup.domain.chat.service.ChatService;
import com.studygroup.global.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatService chatService;

    // 클라이언트가 /pub/chat/room/{roomId}/message 로 메시지를 보내면 이 핸들러가 처리
    @MessageMapping("/chat/room/{roomId}/message")
    public void sendMessage(
            @DestinationVariable Long roomId, // 경로 변수에서 채팅방 ID 추출
            @Payload ChatMessageSendRequest messageDto,
            SimpMessageHeaderAccessor headerAccessor) { // Principal 대신 headerAccessor 사용 권장

        Principal principal = headerAccessor.getUser();
        if (principal == null || !(principal instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken)) {
            log.warn("Unauthorized STOMP message attempt to room {}", roomId);
            // StompErrorHandler가 처리하거나, 여기서 직접 에러 메시지 전송 가능
            // (StompAuthChannelInterceptor에서 CONNECT 시 이미 인증 처리)
            return;
        }

        UserPrincipal userPrincipal = (UserPrincipal) ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal).getPrincipal();
        Long senderId = userPrincipal.getId();

        log.info("Received message for room {}: {} from user {}", roomId, messageDto.getContent(), senderId);
        chatService.processAndSendMessage(roomId, messageDto, senderId);
    }

    // (선택) 사용자가 타이핑 중임을 알리는 메시지 핸들러
    @MessageMapping("/chat/room/{roomId}/typing")
    public void sendTypingIndicator(
            @DestinationVariable Long roomId,
            SimpMessageHeaderAccessor headerAccessor) {
        // Principal principal = headerAccessor.getUser();
        // UserPrincipal userPrincipal = (UserPrincipal) ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal).getPrincipal();
        // String username = userPrincipal.getName();
        // messagingTemplate.convertAndSend("/sub/chat/room/" + roomId + "/typing", username + " is typing...");
    }
}
