package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.ChatMessage;
import com.studygroup.domain.chat.entity.MessageType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatMessageResponse {

    private Long messageId;
    private Long chatRoomId;
    private UserSummaryDto sender;
    private String content;
    private MessageType messageType;
    private LocalDateTime sentAt; // BaseTimeEntity의 createdAt

    public static ChatMessageResponse from(ChatMessage message) {
        return ChatMessageResponse.builder()
                .messageId(message.getId())
                .chatRoomId(message.getChatRoom().getId())
                .sender(UserSummaryDto.from(message.getSender()))
                .content(message.getContent())
                .messageType(message.getMessageType())
                .sentAt(message.getCreatedAt())
                .build();
    }
}
