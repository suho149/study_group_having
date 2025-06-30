package com.studygroup.domain.chat.dto;

import com.studygroup.domain.chat.entity.ChatRoomMember;
import com.studygroup.domain.chat.entity.ChatRoomMemberStatus;
import com.studygroup.domain.study.entity.StudyGroup;
import com.studygroup.domain.study.entity.StudyMemberRole;
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
    private StudyMemberRole roleInStudy; // <--- 스터디 그룹 내 역할

    public static ChatRoomMemberInfoDto from(ChatRoomMember chatRoomMember, StudyGroup studyGroup) { // studyGroup 파라미터 추가
        User user = chatRoomMember.getUser();
        StudyMemberRole role = studyGroup.getMembers().stream()
                .filter(sm -> sm.getUser().getId().equals(user.getId()))
                .map(com.studygroup.domain.study.entity.StudyMember::getRole)
                .findFirst()
                .orElse(null); // 기본적으로는 멤버, 스터디에 없는 경우는 없어야 함

        return ChatRoomMemberInfoDto.builder()
                .id(user.getId())
                .name(user.getName())
                .profileImageUrl(user.getProfile())
                .status(chatRoomMember.getStatus())
                .roleInStudy(role) // 역할 설정
                .build();
    }
}
