package com.studygroup.domain.study.entity;

public enum StudyMemberStatus {
    PENDING("대기 중"),
    APPROVED("승인됨"),
    REJECTED("거절됨");

    private final String displayName;

    StudyMemberStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
} 