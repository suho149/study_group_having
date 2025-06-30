package com.studygroup.domain.friend.entity;

// API 응답으로 사용될, 더 명확한 의미의 상태 Enum
public enum FriendshipStatusType {
    NOT_FRIENDS,        // 아무 관계 아님
    FRIENDS,            // 이미 친구
    REQUEST_SENT,       // 내가 상대방에게 신청 보냄
    REQUEST_RECEIVED    // 상대방이 나에게 신청 보냄
}
