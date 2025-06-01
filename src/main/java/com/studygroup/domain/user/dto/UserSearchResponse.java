package com.studygroup.domain.user.dto;

import com.studygroup.domain.user.entity.User;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSearchResponse {
    private Long id;
    private String name;
    private String email;
    private String profile;

    public static UserSearchResponse from(User user) {
        return UserSearchResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .profile(user.getProfile())
                .build();
    }
} 