package com.studygroup.domain.board.dto;

import com.studygroup.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSummaryDto {
    private Long id;
    private String name;
    private String profileImageUrl; // 프론트 타입과 이름 맞춤 (profile -> profileImageUrl)

    public static UserSummaryDto from(User user) {
        return UserSummaryDto.builder()
                .id(user.getId())
                .name(user.getName())
                .profileImageUrl(user.getProfile())
                .build();
    }
}
