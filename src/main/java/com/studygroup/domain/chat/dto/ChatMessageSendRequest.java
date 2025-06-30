package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.MessageType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageSendRequest {

    // private Long chatRoomId; // 구독 경로에 포함되므로 DTO에서는 생략 가능
    private String content;
    private MessageType messageType = MessageType.TALK; // 기본값은 TALK
}
