package com.studygroup.domain.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum ActivityType {
    SIGN_UP("회원가입", 100),
    CREATE_POST("게시글 작성", 10),
    CREATE_COMMENT("댓글 작성", 5),
    CREATE_STUDY("스터디 생성", 50),
    GET_POST_LIKE("게시글 좋아요 받음", 20);
    // ... 추가적인 활동 정의 가능

    private final String description;
    private final int point;
}
