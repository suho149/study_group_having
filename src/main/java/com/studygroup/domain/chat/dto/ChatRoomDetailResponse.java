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
    private Long studyGroupLeaderId;
    private List<ChatRoomMemberInfoDto> members;
    // private List<ChatMessageResponse> recentMessages; // 최근 메시지 목록 (페이징 처리)

    public static ChatRoomDetailResponse from(ChatRoom chatRoom) {
        return ChatRoomDetailResponse.builder()
                .id(chatRoom.getId())
                .name(chatRoom.getName())
                .studyGroupId(chatRoom.getStudyGroup().getId())
                .studyGroupName(chatRoom.getStudyGroup().getTitle())
                .createdAt(chatRoom.getCreatedAt())
                .studyGroupLeaderId(chatRoom.getStudyGroup().getLeader().getId())
                .members(chatRoom.getMembers().stream() // 모든 멤버 정보를 가져옴
                        .map(member -> ChatRoomMemberInfoDto.from(member, chatRoom.getStudyGroup())) // studyGroup 전달
                        .collect(Collectors.toList()))
                .build();
    }
}
