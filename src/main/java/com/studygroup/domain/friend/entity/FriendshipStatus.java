package com.studygroup.domain.friend.entity;

public enum FriendshipStatus {
    PENDING,  // 친구 신청 대기 중
    ACCEPTED, // 수락됨 (친구 상태)
    REJECTED, // 거절됨
    BLOCKED   // 차단됨 (추후 확장 가능)
}
