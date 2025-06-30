package com.studygroup.domain.user.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum InteractionType {
    VIEW_STUDY(1),      // 스터디 조회: +1점
    LIKE_STUDY(5);      // 스터디 좋아요: +5점

    // 게시글에 태그 기능이 추가된다면 확장 가능
    // VIEW_POST(1),
    // LIKE_POST(3);

    private final int score;
}
