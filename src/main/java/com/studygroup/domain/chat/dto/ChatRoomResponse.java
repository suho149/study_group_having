package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ChatRoomResponse {

    private Long id;
    private String name;
    private Long studyGroupId;
    private String studyGroupName; // 스터디 그룹 이름 (UI 표시용)
    private LocalDateTime createdAt;
    private String lastMessageContent;
    private LocalDateTime lastMessageAt;
    private int memberCount;
    // private int unreadCount; // 현재 사용자의 안 읽은 메시지 수 (추가 구현 필요)

    public static ChatRoomResponse from(ChatRoom chatRoom) {
        return ChatRoomResponse.builder()
                .id(chatRoom.getId())
                .name(chatRoom.getName())
                .studyGroupId(chatRoom.getStudyGroup().getId())
                .studyGroupName(chatRoom.getStudyGroup().getTitle())
                .createdAt(chatRoom.getCreatedAt())
                .lastMessageContent(chatRoom.getLastMessageContent())
                .lastMessageAt(chatRoom.getLastMessageAt())
                .memberCount(chatRoom.getMembers().size()) // JOINED 상태 멤버만 카운트하도록 수정 필요
                .build();
    }
}
