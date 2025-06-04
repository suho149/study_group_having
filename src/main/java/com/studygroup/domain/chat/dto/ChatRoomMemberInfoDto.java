package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.ChatRoomMember;
import com.studygroup.domain.chat.entity.ChatRoomMemberStatus;
import com.studygroup.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ChatRoomMemberInfoDto {
    private Long id; // User ID (프론트엔드 ChatRoomMemberInfo.id와 일치시키기 위해 userId -> id로 변경)
    private String name;
    private String profileImageUrl;
    private ChatRoomMemberStatus status;

    public static ChatRoomMemberInfoDto from(ChatRoomMember chatRoomMember) {
        User user = chatRoomMember.getUser();
        return ChatRoomMemberInfoDto.builder()
                .id(user.getId()) // userId -> id
                .name(user.getName())
                .profileImageUrl(user.getProfile())
                .status(chatRoomMember.getStatus())
                .build();
    }
}
