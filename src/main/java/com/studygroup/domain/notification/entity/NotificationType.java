package com.studygroup.domain.notification.entity;

public enum NotificationType {
    STUDY_INVITE("스터디 초대"),
    INVITE_ACCEPTED("초대 수락"),
    INVITE_REJECTED("초대 거절"),
    STUDY_JOIN_REQUEST("스터디 참여 신청"),
    JOIN_APPROVED("스터디 참여 승인"),
    JOIN_REJECTED("스터디 참여 거절"),
    MEMBER_LEFT_STUDY("스터디 멤버 탈퇴");

    private final String description;

    NotificationType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
} 