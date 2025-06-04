package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.ChatRoom;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@Builder
public class ChatRoomDetailResponse {
    private Long id;
    private String name;
    private Long studyGroupId;
    private String studyGroupName;
    private LocalDateTime createdAt;
    private List<UserSummaryDto> members; // 참여 중인 멤버 목록 (JOINED 상태)
    // private List<ChatMessageResponse> recentMessages; // 최근 메시지 목록 (페이징 처리)

    public static ChatRoomDetailResponse from(ChatRoom chatRoom) {
        return ChatRoomDetailResponse.builder()
                .id(chatRoom.getId())
                .name(chatRoom.getName())
                .studyGroupId(chatRoom.getStudyGroup().getId())
                .studyGroupName(chatRoom.getStudyGroup().getTitle())
                .createdAt(chatRoom.getCreatedAt())
                .members(chatRoom.getMembers().stream()
                        .filter(member -> member.getStatus() == com.studygroup.domain.chat.entity.ChatRoomMemberStatus.JOINED)
                        .map(member -> UserSummaryDto.from(member.getUser()))
                        .collect(Collectors.toList()))
                .build();
    }
}
