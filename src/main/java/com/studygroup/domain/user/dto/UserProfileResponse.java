package com.studygroup.domain.user.dto;

import com.studygroup.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserProfileResponse {
    private Long id;
    private String name;
    private String email;
    private String profileImageUrl; // 프로필 이미지 URL
    private LocalDateTime createdAt; // 가입일
    // --- 포인트 및 레벨 필드 추가 ---
    private int point;
    private int level;

    public static UserProfileResponse from(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profileImageUrl(user.getProfile()) // User 엔티티의 profile 필드
                .createdAt(user.getCreatedAt())
                .point(user.getPoint())
                .level(user.getLevel())
                .build();
    }
}
