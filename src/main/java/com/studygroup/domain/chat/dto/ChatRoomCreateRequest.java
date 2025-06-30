package com.studygroup.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class ChatRoomCreateRequest {

    @NotBlank(message = "채팅방 이름은 필수입니다.")
    @Size(max = 100, message = "채팅방 이름은 100자 이하로 입력해주세요.")
    private String name;

    @NotEmpty(message = "초대할 멤버를 선택해주세요.")
    private List<Long> invitedMemberIds; // 초대할 스터디 멤버들의 User ID 목록
}
